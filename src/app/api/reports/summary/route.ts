import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number((v ?? '').toString().replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const isSchemaMismatchError = (err: any) => {
  const msg = String(err?.message || err?.details || '').toLowerCase();
  const code = String(err?.code || err?.error_code || '');
  return (
    code === '42703' ||
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('unknown field')
  );
};

const normalizeStatus = (v: unknown): string => (v ?? '').toString().trim().toLowerCase();
const paidLabels = ['paid', 'lunas', 'selesai', 'done'];
const isPaidStatus = (status: unknown): boolean => {
  const s = normalizeStatus(status);
  if (!s) return false;
  return paidLabels.some((p) => normalizeStatus(p) === s);
};

async function tableHasColumn(supabase: any, table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;
  return !isSchemaMismatchError(error);
}

async function getOwnershipFilter(supabase: any, table: string, userId: string) {
  const hasUserId = await tableHasColumn(supabase, table, 'user_id');
  const hasOwnerId = await tableHasColumn(supabase, table, 'owner_id');

  if (hasUserId && hasOwnerId) {
    return {
      apply(q: any) {
        return q.or(`user_id.eq.${userId},owner_id.eq.${userId}`);
      },
    };
  }

  if (hasUserId) {
    return {
      apply(q: any) {
        return q.eq('user_id', userId);
      },
    };
  }

  if (hasOwnerId) {
    return {
      apply(q: any) {
        return q.eq('owner_id', userId);
      },
    };
  }

  return {
    apply(q: any) {
      return q;
    },
  };
}

async function pickAmountColumn(supabase: any, table: string, candidates: string[]) {
  for (const col of candidates) {
    const ok = await tableHasColumn(supabase, table, col);
    if (ok) return col;
  }
  return candidates[0];
}

const parseItems = (raw: any) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getRange = (start?: string | null, end?: string | null) => {
  const now = new Date();
  if (!start || !end) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start: startOfMonth,
      end: endOfToday,
    };
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59.999`);
  return { start: startDate, end: endDate };
};

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const { start, end } = getRange(startParam, endParam);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const salesTotals = { total: 0, count: 0, items: 0 };
  const salesItems = new Map<string, number>();

  // Transactions (sales)
  let transactionIds: string[] = [];
  const hasTransactions = await tableHasColumn(supabase, 'transactions', 'transaction_date');
  if (hasTransactions) {
    const ownership = await getOwnershipFilter(supabase, 'transactions', user.id);
    const amountCol = await pickAmountColumn(supabase, 'transactions', ['total', 'grand_total', 'amount']);

    let q: any = supabase
      .from('transactions')
      .select(`id, ${amountCol}, transaction_date, payment_status, paid_amount, down_payment, remaining_amount, customer_name, customer_id, due_date`);
    q = ownership.apply(q);
    const { data: txRows } = await q
      .gte('transaction_date', startIso)
      .lte('transaction_date', endIso);

    for (const row of txRows || []) {
      salesTotals.total += Math.max(0, toNumber((row as any)?.[amountCol]));
      salesTotals.count += 1;
      if (row?.id) transactionIds.push(String(row.id));
    }

    const hasItems = await tableHasColumn(supabase, 'transaction_items', 'transaction_id');
    if (hasItems && transactionIds.length) {
      const qtyCol = (await tableHasColumn(supabase, 'transaction_items', 'quantity')) ? 'quantity' : 'qty';
      const { data: itemRows } = await supabase
        .from('transaction_items')
        .select(`transaction_id, product_name, ${qtyCol}`)
        .in('transaction_id', transactionIds);

      for (const item of itemRows || []) {
        const name = String((item as any)?.product_name || '').trim();
        if (!name) continue;
        const qty = toNumber((item as any)?.[qtyCol]);
        salesTotals.items += qty;
        salesItems.set(name, (salesItems.get(name) || 0) + qty);
      }
    }
  }

  // Legacy incomes (fallback when no transactions)
  if (!hasTransactions) {
    const ownership = await getOwnershipFilter(supabase, 'incomes', user.id);
    const amountCol = await pickAmountColumn(supabase, 'incomes', ['amount', 'total', 'grand_total']);
    let q: any = supabase
      .from('incomes')
      .select(`id, ${amountCol}, income_date, payment_status, paid_amount, down_payment, remaining_amount, customer_name, customer_id, due_date`);
    q = ownership.apply(q);
    const { data: incomeRows } = await q
      .gte('income_date', startParam || startIso.split('T')[0])
      .lte('income_date', endParam || endIso.split('T')[0]);

    for (const row of incomeRows || []) {
      salesTotals.total += Math.max(0, toNumber((row as any)?.[amountCol]));
      salesTotals.count += 1;
    }
  }

  // Storefront orders (exclude ones already linked to transactions)
  const { data: storefronts } = await supabase
    .from('business_storefronts')
    .select('id')
    .eq('user_id', user.id);

  const storefrontIds = (storefronts || []).map((s: any) => s.id);
  if (storefrontIds.length) {
    const { data: orderRows } = await supabase
      .from('storefront_orders')
      .select('total_amount, status, created_at, order_items, transaction_id')
      .in('storefront_id', storefrontIds)
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    const revenueStatuses = new Set(['confirmed', 'preparing', 'shipped', 'completed']);
    for (const order of orderRows || []) {
      if ((order as any)?.transaction_id) continue;
      const status = normalizeStatus((order as any)?.status);
      if (!revenueStatuses.has(status)) continue;

      salesTotals.total += Math.max(0, toNumber((order as any)?.total_amount));
      salesTotals.count += 1;

      const items = parseItems((order as any)?.order_items);
      for (const item of items) {
        const name = String(item?.product_name || item?.name || item?.title || '').trim();
        if (!name) continue;
        const qty = toNumber(item?.quantity || item?.qty || 0);
        salesTotals.items += qty;
        salesItems.set(name, (salesItems.get(name) || 0) + qty);
      }
    }
  }

  // Expenses
  const expenseTotals = { total: 0, count: 0 };
  const ownershipExp = await getOwnershipFilter(supabase, 'expenses', user.id);
  const expenseAmountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total']);
  let expQ: any = supabase
    .from('expenses')
    .select(`${expenseAmountCol}, expense_date`);
  expQ = ownershipExp.apply(expQ);
  const { data: expenseRows } = await expQ
    .gte('expense_date', startParam || startIso.split('T')[0])
    .lte('expense_date', endParam || endIso.split('T')[0]);

  for (const row of expenseRows || []) {
    expenseTotals.total += Math.max(0, toNumber((row as any)?.[expenseAmountCol]));
    expenseTotals.count += 1;
  }

  // Receivables (from transactions or incomes)
  let receivablesTotal = 0;
  let receivablesOverdue = 0;
  let receivablesSoon = 0;
  const receivableCustomers = new Set<string>();
  const today = new Date();
  const soonLimit = new Date(today);
  soonLimit.setDate(soonLimit.getDate() + 7);

  const receivableRowsSource = hasTransactions
    ? { table: 'transactions', dateCol: 'transaction_date' }
    : { table: 'incomes', dateCol: 'income_date' };

  if (await tableHasColumn(supabase, receivableRowsSource.table, receivableRowsSource.dateCol)) {
    const ownership = await getOwnershipFilter(supabase, receivableRowsSource.table, user.id);
    const amountCol = await pickAmountColumn(supabase, receivableRowsSource.table, ['total', 'grand_total', 'amount']);
    const selectCols = [
      amountCol,
      receivableRowsSource.dateCol,
      'payment_status',
      'paid_amount',
      'down_payment',
      'remaining_amount',
      'customer_id',
      'customer_name',
      'due_date',
    ].join(',');

    let q: any = supabase.from(receivableRowsSource.table).select(selectCols);
    q = ownership.apply(q);
    const { data: rows } = await q
      .gte(receivableRowsSource.dateCol, startParam || startIso.split('T')[0])
      .lte(receivableRowsSource.dateCol, endParam || endIso.split('T')[0]);

    for (const row of rows || []) {
      const total = Math.max(0, toNumber((row as any)?.[amountCol]));
      const paid = Math.max(toNumber((row as any)?.paid_amount), toNumber((row as any)?.down_payment));
      const remaining = Math.max(0, toNumber((row as any)?.remaining_amount) || total - paid);
      if (remaining <= 0) continue;
      if (isPaidStatus((row as any)?.payment_status)) continue;

      receivablesTotal += remaining;
      const dueDateRaw = (row as any)?.due_date ? new Date((row as any)?.due_date) : null;
      if (dueDateRaw) {
        if (dueDateRaw.getTime() < today.getTime()) receivablesOverdue += remaining;
        if (dueDateRaw.getTime() >= today.getTime() && dueDateRaw.getTime() <= soonLimit.getTime()) {
          receivablesSoon += remaining;
        }
      }

      const customerKey = String((row as any)?.customer_id || (row as any)?.customer_name || '').trim();
      if (customerKey) receivableCustomers.add(customerKey);
    }
  }

  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const salesAvg = salesTotals.count ? salesTotals.total / salesTotals.count : 0;
  const expenseAvgDaily = expenseTotals.total / daysDiff;
  const expenseRatio = salesTotals.total > 0 ? (expenseTotals.total / salesTotals.total) * 100 : 0;
  const netProfit = salesTotals.total - expenseTotals.total;
  const profitMargin = salesTotals.total > 0 ? (netProfit / salesTotals.total) * 100 : 0;

  const topProducts = Array.from(salesItems.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return NextResponse.json({
    range: {
      start: startIso,
      end: endIso,
    },
    sales: {
      total: salesTotals.total,
      count: salesTotals.count,
      avg: salesAvg,
      items: salesTotals.items,
    },
    expenses: {
      total: expenseTotals.total,
      count: expenseTotals.count,
      avgDaily: expenseAvgDaily,
      ratio: expenseRatio,
    },
    profitLoss: {
      revenue: salesTotals.total,
      expenses: expenseTotals.total,
      netProfit,
      margin: profitMargin,
    },
    receivables: {
      total: receivablesTotal,
      overdue: receivablesOverdue,
      dueSoon: receivablesSoon,
      customers: receivableCustomers.size,
    },
    topProducts,
  });
}

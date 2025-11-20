# 🗺️ Feature Roadmap - Katalara Platform

## ✅ Current Version (v1.0 MVP)

### Core Features LIVE:
- ✅ **Smart Batch Purchase Learning System**
  - Manual input: Total belanja + Output porsi
  - Auto-calculate cost per portion
  - Real-time calculation display
  - Clean, intuitive UI

- ✅ **Product Intelligence Dashboard**
  - Desktop: Centered tabs, full table
  - Mobile: Compact list view, no horizontal scroll
  - Category filtering
  - Search & actions

- ✅ **Universal Business Support**
  - SQL schema ready (10 business types)
  - Manufacturing, F&B, Service, Trading, etc.

- ✅ **Expense Tracking**
  - Manual input form
  - Payment methods: Tunai, Transfer, Tempo/Hutang
  - Category selection with batch purchase mode
  - Notes field for shopping details

---

## 🚧 In Progress (Backend Integration)

### Priority: HIGH
- ⏳ **SQL Migration Execution**
  - Run `create_smart_learning_system.sql` in Supabase
  - Create all tables, triggers, functions
  - Status: SQL ready, waiting for execution

- ⏳ **API Endpoints**
  - POST `/api/batch-purchase` - Save purchase + outputs
  - GET `/api/batch-purchase/suggestions` - AI suggestions
  - Status: Code samples in IMPLEMENTATION_CHECKLIST.md

- ⏳ **Pattern Learning Algorithm**
  - Auto-learn after 3+ purchases
  - Confidence scoring (0-100)
  - Group similar purchases (±10% tolerance)
  - Status: SQL function ready, needs API integration

---

## 🔮 Future Features (Post-MVP)

### Phase 2: AI Enhancement (1-2 months)

#### **1. AI Receipt Scanner** 🎯
**Status:** Code ready, disabled for MVP
**Why disabled:** Tesseract.js accuracy 70-80%, not reliable enough
**Upgrade path:**
- Option A: Google Cloud Vision API ($1.50/1k scans, 95% accuracy)
- Option B: OpenAI GPT-4 Vision (slower, more expensive, very accurate)
- Option C: Custom AI model (train on Indonesian receipts)

**Implementation:**
```typescript
// Already built: src/components/expenses/ReceiptScanner.tsx
// Uncomment in: src/app/dashboard/input-expenses/page.tsx line 3, 180-193
```

**Trigger to enable:**
- 100+ active users
- $50-100/month budget for AI API
- User feedback requesting feature

**Features when enabled:**
- 📸 Photo upload (camera/gallery)
- 🤖 AI extract: total, vendor, items
- ✅ User review & confirm
- 🚀 Auto-fill amount & notes

---

#### **2. Voice Input Alternative** 🎤
**Status:** Not started
**Priority:** Medium
**Use case:** Non-tech users, delivery drivers

**Flow:**
```
User speaks: "Beli beras 5kg, telur 2kg, mie 4 bungkus, total 500 ribu"
→ Speech-to-text (Google/OpenAI)
→ Parse with AI
→ Auto-fill form
```

**Benefits:**
- ⚡ Ultra fast (5 seconds vs 2 minutes)
- 📱 Great for mobile
- ♿ Accessibility friendly

**Cost:** ~$0.006 per minute (Google Speech-to-Text)

---

#### **3. Smart Item Matching** 🔗
**Status:** Not started
**Priority:** High (after AI scanner enabled)

**Problem:** User scan struk, dapat "Beras", tapi database punya "Beras Premium", "Beras Pulen", "Beras Organik"

**Solution:**
- AI fuzzy matching
- Show suggestions: "Beras" → ["Beras Premium 90%", "Beras Pulen 80%"]
- User click → Auto-map
- Learn from user choices

**Tech:**
- Levenshtein distance
- TF-IDF similarity
- Or use OpenAI embeddings

---

### Phase 3: Advanced Analytics (2-3 months)

#### **4. Waste Analytics Dashboard** 📊
**Status:** SQL ready, UI not started
**Tables:** `waste_logs`, `batch_purchase_outputs`

**Features:**
- Waste percentage per product
- Trend: Makin banyak/sedikit waste?
- Cost impact: Berapa rupiah terbuang?
- Recommendations: "Kurangi produksi Nasi Goreng 10 porsi"

**Functions ready:**
```sql
SELECT * FROM calculate_waste_stats(user_id, start_date, end_date);
```

---

#### **5. Market Price Trends** 📈
**Status:** SQL ready, UI not started
**Table:** `market_price_history`

**Features:**
- Track cost per portion over time
- Alert: "Harga naik 15% dari rata-rata"
- Seasonal patterns
- Suggestions: "Tunggu seminggu, biasanya turun"

---

#### **6. Purchase Suggestions** 💡
**Status:** SQL function ready, API not built
**Table:** `learned_purchase_patterns`

**Features:**
- "Biasanya Rp 500k → 70 Nasi Goreng + 30 Mie Goreng"
- Confidence badge: "85% confident (5 data)"
- One-click apply suggestion
- Adjust if needed

**Function ready:**
```sql
SELECT * FROM get_purchase_suggestion(user_id);
```

---

### Phase 4: Automation & Intelligence (3-6 months)

#### **7. Auto-Reorder System** 🔄
- Monitor inventory levels
- Predict when stock habis
- Auto-suggest reorder timing
- Integration dengan supplier (WhatsApp/email)

#### **8. Recipe Optimization** 🧪
- A/B test different batch sizes
- Find optimal production quantity
- Minimize waste
- Maximize profit margin

#### **9. Multi-Location Support** 🏪
- Manage multiple branches
- Compare performance
- Shared inventory
- Consolidated reports

#### **10. Supplier Management** 🤝
- Track multiple vendors
- Price comparison
- Quality ratings
- Auto-select best supplier

---

## 🎯 Decision Framework

### When to enable AI Receipt Scanner?

**Metrics:**
- [ ] 100+ active users
- [ ] 50+ users request feature
- [ ] Budget available: $50-100/month
- [ ] Manual input pain point validated

**Alternative:** Keep manual if:
- Users OK with current flow
- Manual input < 2 min
- Budget constraint
- Focus on other features

---

### When to build Voice Input?

**Trigger:**
- [ ] Mobile users > 70%
- [ ] Users complain about typing
- [ ] Delivery/field workers using app
- [ ] Budget: $20-50/month

---

### When to build Analytics?

**Trigger:**
- [ ] Users have 30+ batch purchases
- [ ] Users ask: "Kenapa cost naik?"
- [ ] Waste tracking requested
- [ ] Price alerts requested

---

## 📋 Implementation Priority

### URGENT (This Week):
1. ✅ Manual batch purchase UI (DONE)
2. ⏳ Run SQL migration in Supabase
3. ⏳ Build POST `/api/batch-purchase` endpoint
4. ⏳ Test end-to-end flow

### HIGH (Next 2 Weeks):
5. ⏳ Pattern learning algorithm
6. ⏳ Suggestions API
7. ⏳ Waste tracking UI
8. ⏳ User testing & feedback

### MEDIUM (Next Month):
9. 🔮 Decide: Enable AI scanner or not?
10. 🔮 Analytics dashboard v1
11. 🔮 Mobile app optimization

### LOW (Future):
12. 🔮 Voice input
13. 🔮 Multi-location
14. 🔮 Supplier management

---

## 💭 Philosophy

**"Perfect is the enemy of good"**

Start simple:
- ✅ Manual input works
- ✅ User learns the flow
- ✅ We collect feedback
- ✅ Iterate based on real needs

Then enhance:
- 🚀 Add AI when validated
- 🚀 Automate when requested
- 🚀 Scale when needed

**MVP → MLP → MPP**
(Minimum Viable → Lovable → Profitable Product)

---

## 🎉 Summary

**Current state:** Solid MVP with manual input  
**Next step:** Backend integration (SQL + API)  
**Future:** AI features ready, enable when needed

**Code status:**
- ✅ UI: Complete & deployed
- ✅ SQL: Ready for execution
- ✅ API samples: Documented
- 🔮 AI scanner: Built but disabled
- 🔮 Voice input: Planned
- 🔮 Analytics: SQL ready, UI pending

Smart strategy: **Validate → Iterate → Enhance** 💪

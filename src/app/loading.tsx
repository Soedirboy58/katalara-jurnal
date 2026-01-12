export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#1088ff] animate-spin mx-auto" />
        <div className="mt-4 text-sm text-gray-600">Memuat…</div>
      </div>
    </div>
  )
}

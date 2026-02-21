import { TransactionTable } from "@/components/transactions/transaction-table"
import { ImportDialog } from "@/components/transactions/import-dialog"

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-muted-foreground">Manage your Polymarket trading history</p>
        </div>
        <ImportDialog />
      </div>
      <TransactionTable />
    </div>
  )
}

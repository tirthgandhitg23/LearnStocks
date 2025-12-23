import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stock } from "@/types";
import { isNSEMarketOpen, nextMarketSession } from "@/lib/marketHours";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: Stock | null;
  action: "buy" | "sell";
  onConfirm: (quantity: number) => void;
}

const TradeDialog = ({ open, onOpenChange, stock, action, onConfirm }: TradeDialogProps) => {
  const [quantity, setQuantity] = useState<number>(0);

  useEffect(() => {
    if (!open) setQuantity(0);
  }, [open]);

  if (!stock) return null;

  const total = (quantity || 0) * stock.price;
  const marketOpen = isNSEMarketOpen();
  const { opensAt, isOpen } = nextMarketSession();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{action === "buy" ? `Buy ${stock.symbol}` : `Sell ${stock.symbol}`}</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {!marketOpen && (
            <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
              Market is closed. Orders allowed 09:15–15:30 IST (Mon–Fri). Next session: {opensAt.toLocaleString()}
            </div>
          )}
          <div className="mb-3">
            <div className="font-medium">Price</div>
            <div>₹{stock.price.toFixed(2)}</div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input type="number" value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} min={0} />
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="font-semibold">₹{total.toFixed(2)}</div>
          </div>

          <div className="flex gap-2">
            <Button className="w-full" disabled={!marketOpen} onClick={() => onConfirm(quantity)}>{action === "buy" ? "Buy" : "Sell"}</Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;

"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/date-range";
import { toDateInputValue } from "@/lib/format";

export function StatsRangePicker({
  currentRange,
  currentFrom,
  currentTo,
}: {
  currentRange: RangeKey;
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(currentFrom);
  const [customTo, setCustomTo] = useState(currentTo);

  function applyRange(key: RangeKey, from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", key);
    if (key === "custom") {
      params.set("from", from);
      params.set("to", to);
    } else {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRange}
        onValueChange={(value) => applyRange(value as RangeKey, customFrom, customTo)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_OPTIONS.map((o) => (
            <SelectItem key={o.key} value={o.key}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentRange === "custom" && (
        <>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            max={toDateInputValue(new Date())}
            className="w-[150px]"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            max={toDateInputValue(new Date())}
            className="w-[150px]"
          />
          <Button size="sm" onClick={() => applyRange("custom", customFrom, customTo)}>
            Anwenden
          </Button>
        </>
      )}
    </div>
  );
}

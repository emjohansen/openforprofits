
"use client";

import type { TargetAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, DollarSign, TrendingDown, Package, MinusCircle, Goal } from 'lucide-react'; // Added Goal icon
import { Separator } from './ui/separator';

interface TargetAnalysisDisplayProps {
  targets: TargetAnalysis | null;
  timePeriod: 'monthly' | 'annually';
  currency: string;
  desiredProfitMargin?: number; // Receive the desired margin
}

const TargetItem = ({ label, value, icon: Icon, description }: { label: string; value: string; icon: React.ElementType; description: string }) => (
  <div className="flex flex-col py-3 border-b last:border-b-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-base font-semibold">{label}</span>
      </div>
       <span className={`text-base font-bold ${value?.includes('Infinity') || value?.includes('N/A') ? 'text-destructive' : 'text-primary'}`}>
         {value === 'Infinity' ? '∞ (Unreachable)' : value}
        </span>
    </div>
    <p className="text-xs text-muted-foreground mt-1 ml-7">{description}</p>
  </div>
);


export function TargetAnalysisDisplay({ targets, timePeriod, currency, desiredProfitMargin }: TargetAnalysisDisplayProps) {
   const periodLabel = timePeriod === 'monthly' ? 'Month' : 'Year';
   const hasDesiredMarginTargets = desiredProfitMargin !== undefined && desiredProfitMargin > 0 && targets?.unitsForDesiredMargin !== undefined;

  if (!targets) {
    return (
       <Card className="w-full shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Profitability Targets</CardTitle>
           <CardDescription>How to reach break-even or desired profit.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Enter your business data to see the targets.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl">Profitability Targets</CardTitle>
        <CardDescription>Minimums needed ({periodLabel}ly) to cover costs or achieve your desired profit margin.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Break-Even Section */}
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-muted-foreground" /> Break-Even Targets</h3>
            <div className="space-y-3">
            <TargetItem
                label="Units to Sell"
                value={targets.unitsToBreakEven}
                icon={Package}
                description={`Minimum units to sell per ${periodLabel} to cover all costs.`}
            />
            <TargetItem
                label="Price per Unit"
                value={targets.priceToBreakEven}
                icon={DollarSign}
                description={`Minimum gross price per unit needed at current ${periodLabel}ly sales volume.`}
            />
            <TargetItem
                    label="Reduce Direct Variable Cost By"
                    value={targets.directVariableCostReductionToBreakEven}
                    icon={TrendingDown}
                    description={`Amount each unit's direct variable cost must decrease (in ${currency}).`}
            />
            <TargetItem
                    label={`Reduce Fixed Costs By (per ${periodLabel})`}
                    value={targets.fixedCostReductionToBreakEven}
                    icon={MinusCircle}
                    description={`Total amount ${periodLabel}ly fixed costs (excl. depreciation) must decrease (in ${currency}).`}
            />
            </div>
        </div>

        {/* Desired Profit Margin Section (Conditional) */}
        {hasDesiredMarginTargets && (
            <>
                <Separator className="my-6" />
                <div className="mb-6">
                     <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                         <Goal className="w-5 h-5 text-accent" /> {desiredProfitMargin}% Profit Margin Targets
                         {targets.calculatedTargetProfit && <span className="text-sm font-normal text-muted-foreground"> (Target Profit: {targets.calculatedTargetProfit})</span>}
                     </h3>
                     <div className="space-y-3">
                        <TargetItem
                            label="Units to Sell"
                            value={targets.unitsForDesiredMargin ?? 'N/A'}
                            icon={Package}
                            description={`Units to sell per ${periodLabel} to achieve the target margin.`}
                        />
                        <TargetItem
                            label="Price per Unit"
                            value={targets.priceForDesiredMargin ?? 'N/A'}
                            icon={DollarSign}
                            description={`Gross price per unit needed at current ${periodLabel}ly sales volume.`}
                        />
                         <TargetItem
                                label="Reduce Direct Variable Cost By"
                                value={targets.directVariableCostReductionForDesiredMargin ?? 'N/A'}
                                icon={TrendingDown}
                                description={`Amount each unit's direct variable cost must decrease (in ${currency}).`}
                         />
                        <TargetItem
                                label={`Reduce Fixed Costs By (per ${periodLabel})`}
                                value={targets.fixedCostReductionForDesiredMargin ?? 'N/A'}
                                icon={MinusCircle}
                                description={`Total amount ${periodLabel}ly fixed costs (excl. depreciation) must decrease (in ${currency}).`}
                         />
                    </div>
                </div>
            </>
        )}


        <p className="text-xs text-muted-foreground mt-4 italic">
           Note: Targets assume other factors remain constant. 'Infinity' means the target is not possible by changing only this factor under current conditions (e.g., variable costs exceed revenue, required reduction is impossible). 'N/A' indicates calculation was not applicable (e.g., no desired margin set).
         </p>
      </CardContent>
    </Card>
  );
}


"use client";

import type { CalculationResults } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatResults, formatCurrency } from '@/lib/calculations'; // Import formatCurrency
import { TrendingUp, TrendingDown, Scale, Target, Percent, Landmark, ShieldCheck, ShieldAlert, MinusSquare, PiggyBank, Undo2 } from 'lucide-react'; // Added Undo2
import { Separator } from '@/components/ui/separator'; // Import Separator

interface ResultsDisplayProps {
  results: CalculationResults | null;
  timePeriod: 'monthly' | 'annually';
  currency: string;
}

const ResultItem = ({ label, value, icon: Icon, description }: { label: string; value: string; icon: React.ElementType, description?: string }) => (
  <div className="flex flex-col py-2 border-b last:border-b-0">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold">{value}</span>
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1 ml-6">{description}</p>}
  </div>
);


export function ResultsDisplay({ results, timePeriod, currency }: ResultsDisplayProps) {
  const periodLabel = timePeriod === 'monthly' ? 'Month' : 'Year';

  if (!results) {
    return (
      <Card className="w-full shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Enter your business data to see the results.</p>
        </CardContent>
      </Card>
    );
  }

  const formatted = formatResults(results, currency);
  const isProfitable = results.isProfitable;
  const hasInvestment = results.roi !== 'N/A'; // Check if ROI was calculated

  return (
    <Card className={`w-full shadow-lg rounded-xl ${isProfitable ? 'border-accent bg-green-50' : 'border-destructive bg-red-50'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Profitability ({periodLabel}ly)</CardTitle>
        <Badge variant={isProfitable ? 'default' : 'destructive'} className={`text-xs font-semibold ${isProfitable ? 'bg-accent text-accent-foreground' : ''}`}>
          {isProfitable ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> : <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />}
          {isProfitable ? 'Profitable' : 'Not Profitable'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1"> {/* Reduced space */}
            {/* Key Metrics */}
            <ResultItem label={`Net Profit (per ${periodLabel})`} value={formatted.netProfit} icon={isProfitable ? TrendingUp : TrendingDown} description="Profit after all costs and taxes."/>
            <ResultItem label="Profit Margin" value={formatted.profitMargin} icon={Percent} description="Net Profit / Revenue After Returns" />
             {hasInvestment && <ResultItem label={`Return on Investment (ROI)`} value={formatted.roi} icon={Landmark} description="Net Profit / Initial Investment"/>}

             <Separator className="my-2" />

             {/* Break-Even Analysis */}
              <h4 className="text-sm font-medium text-muted-foreground pt-1 pb-1">Break-Even Point</h4>
             <ResultItem label="Break-Even Units" value={formatted.breakEvenUnits} icon={Target} description={`Units needed to sell per ${periodLabel} to cover all costs.`}/>
            <ResultItem label={`Break-Even Revenue (per ${periodLabel})`} value={formatted.breakEvenRevenue} icon={Scale} description={`Gross revenue needed per ${periodLabel} to cover all costs.`} />


             <details className="pt-2">
                <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">Show Detailed Calculation Breakdown</summary>
                <div className="mt-1 space-y-1 pl-4 border-l ml-1">
                     <ResultItem label={`Gross Revenue (per ${periodLabel})`} value={formatted.totalRevenue} icon={TrendingUp} description="Price per Unit * Units Sold" />
                      <ResultItem label={`Revenue After Returns (per ${periodLabel})`} value={formatted.revenueAfterReturns} icon={Undo2} description="Gross Revenue - Returns/Refunds"/>
                     <ResultItem label={`Total Variable Costs (per ${periodLabel})`} value={formatted.totalVariableCosts} icon={TrendingDown} description="Direct Costs + Other Var. Costs + Payment Fees"/>
                     <ResultItem label={`Contribution Margin (per ${periodLabel})`} value={formatted.contributionMargin} icon={Scale} description="Revenue After Returns - Total Variable Costs" />
                      <Separator className="my-1" />
                       {/* Display Total Fixed & Operating Costs */}
                      <ResultItem label={`Total Fixed & Op. Costs (per ${periodLabel})`} value={formatted.totalFixedCosts} icon={PiggyBank} description="Sum of all fixed costs including Loan, Owner Draw, and Depreciation."/>
                     <ResultItem label={`Profit Before Tax (per ${periodLabel})`} value={formatted.profitBeforeTax} icon={Scale} description="Contribution Margin - Total Fixed & Op. Costs"/>
                    {/* Display taxes only if applicable */}
                    {results.taxesPaid > 0 && formatted.taxesPaid !== formatCurrency(0, currency) && <ResultItem label={`Taxes Paid (per ${periodLabel})`} value={formatted.taxesPaid} icon={Percent} />}
                     <Separator className="my-1" />
                     <ResultItem label={`Net Profit (After Tax)`} value={formatted.netProfit} icon={isProfitable ? TrendingUp : TrendingDown} />
                </div>
            </details>
        </div>

      </CardContent>
    </Card>
  );
}

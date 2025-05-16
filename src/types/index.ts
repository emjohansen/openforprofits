export interface BusinessInputData {
  // Core Inputs
  pricePerUnit: number;
  expectedUnitsSold: number;
  directVariableCostPerUnit: number;

  // Detailed Fixed Costs - Original single field
  otherFixedCosts: number; // Used if includeDetailedFixedCosts is false

  // Granular Fixed Costs - Used if includeDetailedFixedCosts is true
  softwareSubscriptions: number;
  professionalFees: number;
  insurance: number;
  licensesAndPermits: number;
  otherDetailedFixedCosts: number; // Catch-all for other granular fixed costs

  // Detailed Variable Costs - Original single field
  otherVariableCostsPercentage: number; // Used if includeDetailedVariableCosts is false

  // Granular Variable Costs - Used if includeDetailedVariableCosts is true
  salesCommissionsPercentage: number; // % of adjusted revenue
  variableShippingFulfillmentPercentage: number; // % of adjusted revenue
  otherSpecificVariableCostPercentage: number; // % of adjusted revenue


  // Fixed Operating Costs (always present)
  salariesWages: number;
  marketingCosts: number;
  rentUtilities: number;

  // Optional Inputs & Toggles
  includeInvestment: boolean;
  initialInvestment: number;

  includeTaxes: boolean;
  taxRate: number; // Percentage

  includeLoan: boolean;
  loanPayment: number; // Periodic payment

  includeDepreciation: boolean;
  depreciationAmortization: number; // Periodic non-cash expense

  includeOtherVariableCosts: boolean; // Toggle for the original single "other variable costs" field
  includeDetailedFixedCosts: boolean; // Toggle for granular fixed costs
  includeDetailedVariableCosts: boolean; // Toggle for granular variable costs


  includePaymentProcessingFees: boolean;
  paymentProcessingFeeRate: number; // Percentage of adjusted revenue

  includeReturnsRefunds: boolean;
  returnsRefundsRate: number; // Percentage of gross revenue

  includeOwnerDraw: boolean;
  ownerDraw: number; // Fixed amount per period

  // Goals
  desiredProfitMargin?: number; // Optional percentage

  // Configuration
  timePeriod: 'monthly' | 'annually';
  currency: string;
  customCurrency?: string;
}

export interface CalculationResults {
  totalRevenue: number;
  revenueAfterReturns: number;
  totalVariableCosts: number;
  contributionMargin: number;
  grossProfit: number;
  totalFixedCosts: number;
  profitBeforeTax: number;
  taxesPaid: number;
  netProfit: number;
  isProfitable: boolean;
  breakEvenUnits: number | string;
  breakEvenRevenue: number | string;
  profitMargin: number | string;
  roi: number | string;
}

export interface TargetAnalysis {
  unitsToBreakEven: string;
  priceToBreakEven: string;
  directVariableCostReductionToBreakEven: string;
  fixedCostReductionToBreakEven: string;
  unitsForDesiredMargin?: string;
  priceForDesiredMargin?: string;
  directVariableCostReductionForDesiredMargin?: string;
  fixedCostReductionForDesiredMargin?: string;
  calculatedTargetProfit?: string;
}

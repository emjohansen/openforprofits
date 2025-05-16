import type { BusinessInputData, CalculationResults, TargetAnalysis } from '@/types';

// Helper to format currency, now accepting currency code/symbol
export const formatCurrency = (value: number | string, currency: string = 'USD'): string => {
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';

  try {
      const minimumFractionDigits = value % 1 === 0 ? 0 : 2;
      // For very small absolute values that are not zero, show more precision
      if (Math.abs(value) < 0.005 && Math.abs(value) > 0) {
          return value.toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 4 });
      }
      return value.toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: minimumFractionDigits, maximumFractionDigits: 2 });
  } catch (e) {
       // Fallback for unrecognized currency codes if toLocaleString fails
       const isSymbol = !/^[a-zA-Z0-9]/.test(currency); // Crude check if it's a symbol
       if (isSymbol) {
           return `${currency}${value.toFixed(2)}`;
       } else {
           return `${value.toFixed(2)} ${currency}`;
       }
  }
};

export const formatPercentage = (value: number | string): string => {
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return 'N/A'; // Or handle as Infinity/-Infinity if more appropriate
  return `${(value * 100).toFixed(2)}%`;
};

export const formatUnits = (value: number | string): string => {
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  // Show decimals only if it's not a whole number
   if (value % 1 !== 0) {
    return value.toFixed(2);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};


export function calculateProfitability(data: BusinessInputData): CalculationResults {
  const {
    pricePerUnit,
    expectedUnitsSold,
    directVariableCostPerUnit,
    salariesWages,
    marketingCosts,
    rentUtilities,
    otherFixedCosts, // Original single field
    includeDetailedFixedCosts, // Toggle for granular fixed
    softwareSubscriptions,
    professionalFees,
    insurance,
    licensesAndPermits,
    otherDetailedFixedCosts: granularOtherFixed, // Granular catch-all

    includeOtherVariableCosts, // Toggle for original single "other variable costs" field
    otherVariableCostsPercentage, // Original single field
    includeDetailedVariableCosts, // Toggle for granular variable
    salesCommissionsPercentage,
    variableShippingFulfillmentPercentage,
    otherSpecificVariableCostPercentage,

    includeInvestment,
    initialInvestment,
    includeTaxes,
    taxRate,
    includeLoan,
    loanPayment,
    includeDepreciation,
    depreciationAmortization,
    includePaymentProcessingFees,
    paymentProcessingFeeRate,
    includeReturnsRefunds,
    returnsRefundsRate,
    includeOwnerDraw,
    ownerDraw,
  } = data;

  const totalRevenue = pricePerUnit * expectedUnitsSold;

  let returnsRefundsAmount = 0;
  if (includeReturnsRefunds && (returnsRefundsRate || 0) > 0) {
    returnsRefundsAmount = totalRevenue * ((returnsRefundsRate || 0) / 100);
  }
  const revenueAfterReturns = totalRevenue - returnsRefundsAmount;

  let totalVariableCosts = directVariableCostPerUnit * expectedUnitsSold;

  if (includeDetailedVariableCosts) {
    if ((salesCommissionsPercentage || 0) > 0) totalVariableCosts += revenueAfterReturns * ((salesCommissionsPercentage || 0) / 100);
    if ((variableShippingFulfillmentPercentage || 0) > 0) totalVariableCosts += revenueAfterReturns * ((variableShippingFulfillmentPercentage || 0) / 100);
    if ((otherSpecificVariableCostPercentage || 0) > 0) totalVariableCosts += revenueAfterReturns * ((otherSpecificVariableCostPercentage || 0) / 100);
  } else if (includeOtherVariableCosts && (otherVariableCostsPercentage || 0) > 0) {
    totalVariableCosts += revenueAfterReturns * ((otherVariableCostsPercentage || 0) / 100);
  }

  if (includePaymentProcessingFees && (paymentProcessingFeeRate || 0) > 0) {
      totalVariableCosts += revenueAfterReturns * ((paymentProcessingFeeRate || 0) / 100);
  }

  const contributionMargin = revenueAfterReturns - totalVariableCosts;
  const grossProfit = contributionMargin; // Assuming no other COGS beyond direct variable and other variable costs

  let currentOtherFixedCosts = 0;
  if (includeDetailedFixedCosts) {
    currentOtherFixedCosts = (softwareSubscriptions || 0) + (professionalFees || 0) + (insurance || 0) + (licensesAndPermits || 0) + (granularOtherFixed || 0);
  } else {
    currentOtherFixedCosts = otherFixedCosts || 0;
  }

  let operationalFixedCosts = (salariesWages || 0) + (marketingCosts || 0) + (rentUtilities || 0) + currentOtherFixedCosts;
  if (includeLoan && (loanPayment || 0) > 0) operationalFixedCosts += (loanPayment || 0);
  if (includeOwnerDraw && (ownerDraw || 0) > 0) operationalFixedCosts += (ownerDraw || 0);

  let effectiveDepreciation = 0;
  if (includeDepreciation && (depreciationAmortization || 0) > 0) {
      effectiveDepreciation = (depreciationAmortization || 0);
  }
  const totalFixedAndOperatingCosts = operationalFixedCosts + effectiveDepreciation;
  const profitBeforeTax = contributionMargin - totalFixedAndOperatingCosts;

  let taxesPaid = 0;
  if (includeTaxes && (taxRate || 0) > 0 && profitBeforeTax > 0) {
    taxesPaid = profitBeforeTax * ((taxRate || 0) / 100);
  }

  const netProfit = profitBeforeTax - taxesPaid;
  const isProfitable = netProfit > 0;

  // Break-even calculations
  const totalCostsToCoverForBreakEven = operationalFixedCosts + effectiveDepreciation; // Depreciation is a fixed cost for this purpose

  let breakEvenUnits: number | string = 'N/A';
  let breakEvenRevenue: number | string = 'N/A';

  const rrFactor = 1 - (includeReturnsRefunds ? (returnsRefundsRate || 0) / 100 : 0);

  let currentOtherVariableCostsRate = 0;
  if (includeDetailedVariableCosts) {
    currentOtherVariableCostsRate = ((salesCommissionsPercentage || 0) / 100) +
                                    ((variableShippingFulfillmentPercentage || 0) / 100) +
                                    ((otherSpecificVariableCostPercentage || 0) / 100);
  } else if (includeOtherVariableCosts) {
    currentOtherVariableCostsRate = (otherVariableCostsPercentage || 0) / 100;
  }

  const ppfFactor = includePaymentProcessingFees ? (paymentProcessingFeeRate || 0) / 100 : 0;
  const effectiveVariableRate = currentOtherVariableCostsRate + ppfFactor;

  const contributionMarginPerUnit = (pricePerUnit * rrFactor * (1 - effectiveVariableRate)) - directVariableCostPerUnit;

  if (contributionMarginPerUnit > 0) {
      breakEvenUnits = totalCostsToCoverForBreakEven / contributionMarginPerUnit;
      breakEvenRevenue = breakEvenUnits * pricePerUnit; // Gross revenue needed
      // Ensure Infinity if components are Infinity
      breakEvenRevenue = isFinite(breakEvenRevenue) ? breakEvenRevenue : Infinity;
      breakEvenUnits = isFinite(breakEvenUnits) ? breakEvenUnits : Infinity;
  } else if (totalCostsToCoverForBreakEven <= 0) { // If fixed costs are zero or negative, BEP is 0 if CM per unit is non-negative
      breakEvenUnits = 0;
      breakEvenRevenue = 0;
  } else { // Negative or zero CM per unit means BEP is infinite if fixed costs > 0
      breakEvenUnits = Infinity;
      breakEvenRevenue = Infinity;
  }

  let profitMargin: number | string = 'N/A';
  if (revenueAfterReturns !== 0) {
    profitMargin = netProfit / revenueAfterReturns;
    profitMargin = isFinite(profitMargin) ? profitMargin : (netProfit === 0 ? 0 : 'N/A');
  }

  let roi: number | string = 'N/A';
  if (includeInvestment && (initialInvestment || 0) > 0) {
    roi = netProfit / (initialInvestment || 1); // Avoid division by zero if investment is 0 somehow
    roi = isFinite(roi) ? roi : (netProfit === 0 ? 0 : 'N/A');
  } else if (includeInvestment && (initialInvestment || 0) === 0 && netProfit >= 0) {
      roi = Infinity; // Infinite ROI if no investment and non-negative profit
  } else if (includeInvestment && (initialInvestment || 0) === 0 && netProfit < 0) {
      roi = -Infinity; // Negative infinite ROI if no investment and loss
  }


  return {
    totalRevenue,
    revenueAfterReturns,
    totalVariableCosts,
    contributionMargin,
    grossProfit,
    totalFixedCosts: totalFixedAndOperatingCosts, // Renamed for clarity in results
    profitBeforeTax,
    taxesPaid,
    netProfit,
    isProfitable,
    breakEvenUnits,
    breakEvenRevenue,
    profitMargin,
    roi,
  };
}

// Utility to calculate targets for a specific net profit (0 for break-even)
function calculateTargetsForProfit(data: BusinessInputData, targetNetProfit: number): Omit<TargetAnalysis, 'unitsToBreakEven' | 'priceToBreakEven' | 'directVariableCostReductionToBreakEven' | 'fixedCostReductionToBreakEven'> & { calculatedTargetProfit?: string; } {
    const {
        pricePerUnit,
        expectedUnitsSold,
        directVariableCostPerUnit,
        salariesWages,
        marketingCosts,
        rentUtilities,
        otherFixedCosts,
        includeDetailedFixedCosts,
        softwareSubscriptions, professionalFees, insurance, licensesAndPermits, otherDetailedFixedCosts: granularOtherFixed,
        includeOtherVariableCosts, otherVariableCostsPercentage,
        includeDetailedVariableCosts, salesCommissionsPercentage, variableShippingFulfillmentPercentage, otherSpecificVariableCostPercentage,
        includeLoan, loanPayment,
        includeDepreciation, depreciationAmortization,
        includePaymentProcessingFees, paymentProcessingFeeRate,
        includeReturnsRefunds, returnsRefundsRate,
        includeOwnerDraw, ownerDraw,
        includeTaxes, taxRate,
        currency,
    } = data;

    let currentOtherFixedCosts = 0;
    if (includeDetailedFixedCosts) {
        currentOtherFixedCosts = (softwareSubscriptions || 0) + (professionalFees || 0) + (insurance || 0) + (licensesAndPermits || 0) + (granularOtherFixed || 0);
    } else {
        currentOtherFixedCosts = otherFixedCosts || 0;
    }

    let operationalFixedCosts = (salariesWages || 0) + (marketingCosts || 0) + (rentUtilities || 0) + currentOtherFixedCosts;
    if (includeLoan && (loanPayment || 0) > 0) operationalFixedCosts += (loanPayment || 0);
    if (includeOwnerDraw && (ownerDraw || 0) > 0) operationalFixedCosts += (ownerDraw || 0);
    let effectiveDepreciation = (includeDepreciation && (depreciationAmortization || 0) > 0) ? (depreciationAmortization || 0) : 0;

    // Adjust targetNetProfit to targetPBT
    let targetPBT = targetNetProfit;
    if (includeTaxes && (taxRate || 0) > 0 && targetNetProfit > 0) { // Only apply tax if PBT would be positive
        const taxFactor = 1 - ((taxRate || 0) / 100);
        if (taxFactor <= 0) { // Tax rate is 100% or more
            targetPBT = Infinity; // Unreachable if any profit is taxed away
        } else {
             targetPBT = targetNetProfit / taxFactor;
        }
    } else if (includeTaxes && (taxRate || 0) > 0 && targetNetProfit <= 0) {
        // If target net profit is zero or negative, PBT is the same as net profit before tax considerations
        targetPBT = targetNetProfit;
    }
    
    if (!isFinite(targetPBT)) {
        return {
            unitsForDesiredMargin: 'Infinity',
            priceForDesiredMargin: 'Infinity',
            directVariableCostReductionForDesiredMargin: 'Infinity',
            fixedCostReductionForDesiredMargin: 'Infinity',
            calculatedTargetProfit: formatCurrency(targetNetProfit, currency) + ' (Unreachable)',
        };
    }

    const targetTotalContributionMargin = targetPBT + operationalFixedCosts + effectiveDepreciation;

    const rrFactor = 1 - (includeReturnsRefunds ? (returnsRefundsRate || 0) / 100 : 0);

    let currentOtherVariableCostsRate = 0;
    if (includeDetailedVariableCosts) {
        currentOtherVariableCostsRate = ((salesCommissionsPercentage || 0) / 100) +
                                      ((variableShippingFulfillmentPercentage || 0) / 100) +
                                      ((otherSpecificVariableCostPercentage || 0) / 100);
    } else if (includeOtherVariableCosts) {
      currentOtherVariableCostsRate = (otherVariableCostsPercentage || 0) / 100;
    }

    const ppfFactor = includePaymentProcessingFees ? (paymentProcessingFeeRate || 0) / 100 : 0;
    const effectiveVariableRate = currentOtherVariableCostsRate + ppfFactor;

    const contributionMarginPerUnit = (pricePerUnit * rrFactor * (1 - effectiveVariableRate)) - directVariableCostPerUnit;

    let unitsTarget: number | string = 'N/A';
    let priceTarget: number | string = 'N/A';
    let dvcReductionTarget: number | string = 'N/A';
    let fixedCostReductionTarget: number | string = 'N/A';

    // Target Units
    if (contributionMarginPerUnit > 0) {
        unitsTarget = targetTotalContributionMargin / contributionMarginPerUnit;
        unitsTarget = isFinite(unitsTarget) ? Math.max(0, unitsTarget) : Infinity;
    } else if (targetTotalContributionMargin <= 0) { // If target CM is <=0, 0 units needed if CM per unit is non-positive
        unitsTarget = 0;
    } else {
        unitsTarget = Infinity;
    }

    // Target Price
    const priceDenominator = expectedUnitsSold * rrFactor * (1 - effectiveVariableRate);
    if (expectedUnitsSold > 0 && priceDenominator > 0) {
        priceTarget = (targetTotalContributionMargin + directVariableCostPerUnit * expectedUnitsSold) / priceDenominator;
        priceTarget = isFinite(priceTarget) ? Math.max(0, priceTarget) : Infinity;
    } else if (expectedUnitsSold <= 0 && targetTotalContributionMargin <= 0) {
        priceTarget = 0; // No sales needed if target CM is non-positive
    } else if (expectedUnitsSold > 0 && priceDenominator <= 0) { // If effective revenue factor is zero or negative
         if (targetTotalContributionMargin + directVariableCostPerUnit * expectedUnitsSold <= 0) {
            priceTarget = 0; // If even with zero price, costs are covered
         } else {
            priceTarget = Infinity; // Unreachable if price results in negative net revenue per unit
         }
    } else {
        priceTarget = Infinity;
    }
    
    // Target DVC Reduction
    let targetDVC: number | string = 'N/A';
     if (expectedUnitsSold > 0) {
         const currentTotalContribution = contributionMarginPerUnit * expectedUnitsSold;
         if (currentTotalContribution >= targetTotalContributionMargin) {
             dvcReductionTarget = 0; // Already meeting/exceeding target
         } else {
             // Target DVC = (Price * EffectiveRevenueFactor) - (TargetCM_Total / Units)
             targetDVC = (pricePerUnit * rrFactor * (1 - effectiveVariableRate)) - (targetTotalContributionMargin / expectedUnitsSold);
              if (isFinite(targetDVC)) {
                  const effectiveTargetDVC = Math.max(0, targetDVC); // DVC cannot be negative
                  const reductionNeeded = directVariableCostPerUnit - effectiveTargetDVC;
                  dvcReductionTarget = (reductionNeeded > 0 && reductionNeeded <= directVariableCostPerUnit) ? reductionNeeded : 0;
                   if (reductionNeeded > directVariableCostPerUnit) { // Implies targetDVC is negative
                      // Check if target is achievable with DVC = 0
                      const contributionWithZeroDVC = (pricePerUnit * rrFactor * (1 - effectiveVariableRate)) * expectedUnitsSold;
                      if (contributionWithZeroDVC >= targetTotalContributionMargin) {
                          dvcReductionTarget = directVariableCostPerUnit; // Max possible reduction
                      } else {
                          dvcReductionTarget = Infinity; // Unreachable even with zero DVC
                      }
                   } else if (reductionNeeded <= 0) { // No reduction needed or targetDVC is higher than current
                     dvcReductionTarget = 0;
                   }
              } else {
                  dvcReductionTarget = Infinity;
              }
         }
     } else if (targetTotalContributionMargin <= 0) { // No sales, but target CM is non-positive
         dvcReductionTarget = 0;
     } else { // No sales, but target CM is positive (unreachable without sales)
         dvcReductionTarget = Infinity;
     }


    // Target Fixed Cost Reduction (Operational Fixed Costs, excluding depreciation)
    const currentTotalContributionForFixedCost = contributionMarginPerUnit * expectedUnitsSold;
    if (!isFinite(currentTotalContributionForFixedCost)) {
       fixedCostReductionTarget = Infinity;
    } else if (currentTotalContributionForFixedCost >= targetTotalContributionMargin) {
        fixedCostReductionTarget = 0; // Already profitable enough or fixed costs are covered
    } else {
        const targetOperationalFixedCosts = currentTotalContributionForFixedCost - targetPBT - effectiveDepreciation;
        if (!isFinite(targetOperationalFixedCosts)) {
            fixedCostReductionTarget = Infinity;
        } else {
            const effectiveTargetOpFixedCosts = Math.max(0, targetOperationalFixedCosts); // OpFixedCosts cannot be negative
            const reductionNeeded = operationalFixedCosts - effectiveTargetOpFixedCosts;
            fixedCostReductionTarget = reductionNeeded > 0 ? reductionNeeded : 0; // Reduction must be positive
            fixedCostReductionTarget = isFinite(fixedCostReductionTarget) ? fixedCostReductionTarget : Infinity;
        }
    }
    

    return {
        unitsForDesiredMargin: formatUnits(unitsTarget),
        priceForDesiredMargin: formatCurrency(priceTarget, currency),
        directVariableCostReductionForDesiredMargin: formatCurrency(dvcReductionTarget, currency),
        fixedCostReductionForDesiredMargin: formatCurrency(fixedCostReductionTarget, currency),
        calculatedTargetProfit: formatCurrency(targetNetProfit, currency), // Store the originally calculated target profit
    };
}


export function calculateTargets(data: BusinessInputData): TargetAnalysis {
    const { desiredProfitMargin, currency } = data;

    // Calculate targets for break-even (targetNetProfit = 0)
    const breakEvenTargets = calculateTargetsForProfit(data, 0);

    let desiredMarginTargets: Partial<TargetAnalysis> = {};

    if (desiredProfitMargin !== undefined && desiredProfitMargin > 0) {
        // Calculate what targetNetProfit should be based on desiredProfitMargin
        // This requires an estimate of revenue. Let's use current expected revenue.
        const currentGrossRevenue = data.pricePerUnit * data.expectedUnitsSold;
        const currentRRfactor = 1 - (data.includeReturnsRefunds ? (data.returnsRefundsRate || 0) / 100 : 0);
        const currentRevenueAfterReturns = currentGrossRevenue * currentRRfactor;

        if (currentRevenueAfterReturns > 0) {
             const targetNetProfitValue = (desiredProfitMargin / 100) * currentRevenueAfterReturns;
             desiredMarginTargets = calculateTargetsForProfit(data, targetNetProfitValue);
        } else {
             // If current revenue is zero, and a positive margin is desired, targets are generally unachievable
             // or require specific handling (e.g., if costs are also zero).
             // For simplicity, mark as N/A or Infinity if revenue is non-positive.
             desiredMarginTargets = {
                 unitsForDesiredMargin: 'N/A', // Or Infinity if appropriate
                 priceForDesiredMargin: 'N/A', // Or Infinity
                 directVariableCostReductionForDesiredMargin: 'N/A',
                 fixedCostReductionForDesiredMargin: 'N/A',
                 calculatedTargetProfit: formatCurrency(0, currency) + " (Est. Revenue is zero)",
             };
        }
    }

    return {
        unitsToBreakEven: breakEvenTargets.unitsForDesiredMargin ?? 'N/A',
        priceToBreakEven: breakEvenTargets.priceForDesiredMargin ?? 'N/A',
        directVariableCostReductionToBreakEven: breakEvenTargets.directVariableCostReductionForDesiredMargin ?? 'N/A',
        fixedCostReductionToBreakEven: breakEvenTargets.fixedCostReductionForDesiredMargin ?? 'N/A',
        ...desiredMarginTargets, // Spread the calculated targets for desired margin
    };
}

// Helper to format the results object into strings
export function formatResults(results: CalculationResults, currency: string): Record<Exclude<keyof CalculationResults, 'isProfitable'>, string> & { isProfitable: string } {
    return {
        totalRevenue: formatCurrency(results.totalRevenue, currency),
        revenueAfterReturns: formatCurrency(results.revenueAfterReturns, currency),
        totalVariableCosts: formatCurrency(results.totalVariableCosts, currency),
        contributionMargin: formatCurrency(results.contributionMargin, currency),
        grossProfit: formatCurrency(results.grossProfit, currency), // Same as CM in this model
        totalFixedCosts: formatCurrency(results.totalFixedCosts, currency),
        profitBeforeTax: formatCurrency(results.profitBeforeTax, currency),
        taxesPaid: formatCurrency(results.taxesPaid, currency),
        netProfit: formatCurrency(results.netProfit, currency),
        isProfitable: results.isProfitable ? 'Yes' : 'No',
        breakEvenUnits: formatUnits(results.breakEvenUnits),
        breakEvenRevenue: formatCurrency(results.breakEvenRevenue, currency),
        profitMargin: formatPercentage(results.profitMargin),
        roi: formatPercentage(results.roi),
    };
}
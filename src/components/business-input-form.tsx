
"use client";

import type { FormSchemaType, BusinessInputData, CalculationResults, TargetAnalysis } from '@/types';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller, FieldPath, UseFormSetValue, UseFormGetValues, Control, useFieldArray, UseFormTrigger } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel, useFormField } from "@/components/ui/form";
import {
    DollarSign, SquareMinus, Package, Percent, Calendar, Landmark, CreditCard, Building, Users, Megaphone, Home, PiggyBank,
    MinusSquare, Undo2, RefreshCw, Wallet, Target, Info, Goal, FileDown, FileUp, Tv, ShoppingBag, Ship,
 UsersRound, FileText as FileTextIcon, ShieldCheck, CircleAlert, HelpingHand, BadgePercent, Settings, Receipt, PlusCircle, XCircle} from 'lucide-react';
import { calculateProfitability, calculateTargets, formatCurrency, formatUnits, formatPercentage } from '@/lib/calculations';
import { ResultsDisplay } from './results-display';
import { TargetAnalysisDisplay } from './target-analysis-display';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  pricePerUnit: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0.01, "Selling Price must be greater than 0").default(1)
  ),
  expectedUnitsSold: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Units Sold cannot be negative").int("Units Sold must be a whole number").default(0)
  ),
  directVariableCostPerUnit: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Direct Cost cannot be negative").default(0)
  ),
  salariesWages: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Salaries cannot be negative").default(0)
  ),
  marketingCosts: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Marketing Costs cannot be negative").default(0)
  ),
  rentUtilities: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Rent/Utilities cannot be negative").default(0)
  ),

  includeDetailedFixedCosts: z.boolean().default(false),
  otherFixedCosts: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  softwareSubscriptions: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  professionalFees: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  insurance: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  licensesAndPermits: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  otherDetailedFixedCosts: z.preprocess( // This is the granular "Other Fixed Costs"
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
   customFixedCosts: z.array(z.object({
    name: z.string().trim().min(1, "Cost name is required"),
    amount: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Amount cannot be negative").default(0)
    ),
  })).optional().default([]),

  includeOtherVariableCosts: z.boolean().default(false),
  otherVariableCostsPercentage: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  includeDetailedVariableCosts: z.boolean().default(false),
  salesCommissionsPercentage: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  variableShippingFulfillmentPercentage: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  otherSpecificVariableCostPercentage: z.preprocess(
      (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
   customVariableCosts: z.array(z.object({
    name: z.string().trim().min(1, "Cost name is required"),
    percentage: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number({ invalid_type_error: "Must be a number" }).min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100").default(0)
    ),
  })).optional().default([]),

  includeInvestment: z.boolean().default(false),
  initialInvestment: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  includeTaxes: z.boolean().default(false),
  taxRate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  includeLoan: z.boolean().default(false),
  loanPayment: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  includeDepreciation: z.boolean().default(false),
  depreciationAmortization: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),

  includePaymentProcessingFees: z.boolean().default(false),
  paymentProcessingFeeRate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  includeReturnsRefunds: z.boolean().default(false),
  returnsRefundsRate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  includeOwnerDraw: z.boolean().default(false),
  ownerDraw: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  desiredProfitMargin: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").optional()
  ),
  timePeriod: z.enum(['monthly', 'annually']).default('monthly'),
  currency: z.string().min(1, "Currency is required.").default('USD'),
  customCurrency: z.string().trim().optional(),
})
.refine((data) => {
    if (!data.includeDetailedFixedCosts) {
        return typeof data.otherFixedCosts === 'number' && data.otherFixedCosts >= 0;
    }
    return true;
}, {
    message: "General Other Fixed Costs is required and must be non-negative when 'Detailed Fixed Costs' is OFF.",
    path: ["otherFixedCosts"],
})
.refine((data) => { // Refinement for detailed fixed costs
    if (data.includeDetailedFixedCosts) {
        const fieldsToValidate: (keyof FormSchemaType)[] = [
            'softwareSubscriptions', 'professionalFees', 'insurance', 'licensesAndPermits', 'otherDetailedFixedCosts'
        ];
        for (const field of fieldsToValidate) {
            const value = data[field] as number | undefined;
            if (value !== undefined && !(typeof value === 'number' && value >= 0)) {
                 return false; // Validation fails if any defined detailed field is not a non-negative number
            }
        }
        if (data.customFixedCosts) {
            for (const customCost of data.customFixedCosts) {
                if (!(typeof customCost.name === 'string' && customCost.name.trim().length > 0 && typeof customCost.amount === 'number' && customCost.amount >= 0)) {
                   return false; // Validation for custom fixed costs
                 }
            }
        }
    }
    return true;
}, {
    message: "All entered Detailed Fixed Cost fields must be non-negative numbers, and custom names cannot be empty.",
    path: ["includeDetailedFixedCosts"], // Error on the toggle
})
.refine(
    (data) => {
      if (data.includeOtherVariableCosts && !data.includeDetailedVariableCosts) { // Only if simple % is on AND detailed is OFF
        return typeof data.otherVariableCostsPercentage === 'number' && data.otherVariableCostsPercentage >= 0 && data.otherVariableCostsPercentage <= 100;
      }
      return true;
    },
    {
      message: "Other Variable Costs percentage (0-100%) is required when 'Simple Other Variable Costs' is enabled and 'Detailed' is not.",
      path: ["otherVariableCostsPercentage"],
    }
  )
  .refine((data) => { // Refinement for detailed variable costs
    if (data.includeDetailedVariableCosts) {
        const fieldsToValidate: (keyof FormSchemaType)[] = [
            'salesCommissionsPercentage', 'variableShippingFulfillmentPercentage', 'otherSpecificVariableCostPercentage'
        ];
        for (const field of fieldsToValidate) {
            const value = data[field] as number | undefined;
            // Only validate if value is not undefined. If it's undefined, it means it's optional and not filled.
            if (value !== undefined && !(typeof value === 'number' && value >= 0 && value <= 100)) {
                return false; // Validation fails if any defined detailed field is not a percentage 0-100
            }
        }
        if (data.customVariableCosts) {
            for (const customCost of data.customVariableCosts) {
                 if (!(typeof customCost.name === 'string' && customCost.name.trim().length > 0 && typeof customCost.percentage === 'number' && customCost.percentage >= 0 && customCost.percentage <= 100)) {
                    return false; // Validation for custom variable costs
                 }
            }
        }
    }
    return true;
}, {
    message: "One or more Detailed Variable Costs are invalid. Percentages must be 0-100, and custom names cannot be empty.",
    path: ["includeDetailedVariableCosts"], // Error on the toggle
})
.refine(data => !data.includeInvestment || (typeof data.initialInvestment === 'number' && data.initialInvestment >= 0), {
    message: "Initial Investment is required and must be a non-negative number when enabled.",
    path: ["initialInvestment"],
})
.refine(data => !data.includeTaxes || (typeof data.taxRate === 'number' && data.taxRate >= 0 && data.taxRate <= 100), {
    message: "Tax Rate (0-100%) is required when enabled.",
    path: ["taxRate"],
})
.refine(data => !data.includeLoan || (typeof data.loanPayment === 'number' && data.loanPayment >= 0), {
    message: "Loan Payment is required and must be non-negative when enabled.",
    path: ["loanPayment"],
})
.refine(data => !data.includeDepreciation || (typeof data.depreciationAmortization === 'number' && data.depreciationAmortization >= 0), {
    message: "Depreciation/Amortization is required and must be non-negative when enabled.",
    path: ["depreciationAmortization"],
})
.refine(data => !data.includePaymentProcessingFees || (typeof data.paymentProcessingFeeRate === 'number' && data.paymentProcessingFeeRate >= 0 && data.paymentProcessingFeeRate <= 100), {
    message: "Payment Processing Fee Rate (0-100%) is required when enabled.",
    path: ["paymentProcessingFeeRate"],
})
.refine(data => !data.includeReturnsRefunds || (typeof data.returnsRefundsRate === 'number' && data.returnsRefundsRate >= 0 && data.returnsRefundsRate <= 100), {
    message: "Returns/Refunds Rate (0-100%) is required when enabled.",
    path: ["returnsRefundsRate"],
})
.refine(data => !data.includeOwnerDraw || (typeof data.ownerDraw === 'number' && data.ownerDraw >= 0), {
    message: "Owner Draw amount is required and must be non-negative when enabled.",
    path: ["ownerDraw"],
})
.refine(data => data.currency !== 'OTHER' || (typeof data.customCurrency === 'string' && data.customCurrency.trim().length > 0), {
    message: "Please specify a custom currency symbol or code.",
    path: ["customCurrency"],
});


interface InputFieldProps {
  name: FieldPath<FormSchemaType>;
  label: string;
  control: Control<FormSchemaType>;
  errors: ReturnType<typeof useForm<FormSchemaType>['formState']['errors']>;
  icon: React.ElementType;
  placeholder?: string;
  type?: string;
  step?: string;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
  onValueCommitted?: () => void;
}


const InputField: React.FC<InputFieldProps> = ({ name, label, control, errors, icon: Icon, placeholder, type = "number", step = "0.01", tooltip, disabled = false, className, onValueCommitted }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fieldError = errors?.[name];

  if (!mounted) {
    return (
        <div className={cn("space-y-2", className)}>
             <div className="flex items-center justify-between">
                <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {label}
                </Label>
             </div>
             <Input
                id={name}
                type={type}
                placeholder={placeholder}
                step={step}
                min={type === 'number' ? "0" : undefined}
                disabled={disabled}
                className={fieldError ? 'border-destructive' : ''}
            />
             {fieldError && (
                <p className="text-xs text-destructive">
                    {(fieldError as { message?: string })?.message || ''}
                </p>
            )}
        </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" /> {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip delayDuration={20}>
              <TooltipTrigger asChild>
                <button type="button" tabIndex={-1} aria-label={`More information about ${label}`} className="cursor-help p-1 rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs text-sm bg-popover text-popover-foreground p-3 rounded-md shadow-md"
                onPointerDownOutside={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('[data-radix-tooltip-trigger]') || target.closest('[data-radix-popper-content-wrapper]')) {
                        event.preventDefault();
                    }
                }}
              >
                <p dangerouslySetInnerHTML={{ __html: tooltip }} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
       <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                id={name}
                type={type}
                placeholder={placeholder}
                step={step}
                min={type === 'number' ? "0" : undefined}
                max={type === 'number' && (name.includes('Percentage') || name.includes('Rate') || name === 'taxRate' || name === 'desiredProfitMargin') ? "100" : undefined}
                {...field}
                onChange={e => {
                  const val = e.target.value;
                  let processedVal;
                   if (val === "") {
                    processedVal = undefined;
                  } else if (type === 'number') {
                    processedVal = Number.isNaN(Number(val)) ? val : Number(val);
                  } else {
                    processedVal = val;
                  }
                  field.onChange(processedVal);
                  if (onValueCommitted) {
                    onValueCommitted();
                  }
                }}
                value={String(field.value ?? '')}
                className={cn(errors && errors[name] ? 'border-destructive' : '', className)}
                disabled={disabled}
              />
            </FormControl>
             {errors && errors[name] && (
                <FormMessage>
                    {(errors[name] as { message?: string })?.message || (Array.isArray(errors[name]) && (errors[name] as any[]).length > 0 ? ((errors[name] as any[])[0] as { message?: string })?.message : '')}
                </FormMessage>
            )}
          </FormItem>
        )}
      />
    </div>
  );
};

interface ToggleFieldProps {
  name: FieldPath<FormSchemaType>;
  label: string;
  control: Control<FormSchemaType>;
  tooltip?: string;
  onValueChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleField: React.FC<ToggleFieldProps> = (props) => {
  const { name, label, control, tooltip, onValueChange, disabled = false } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
         <div className="flex items-center justify-between space-x-2 pt-2">
             <div className="flex items-center gap-1">
                <Label htmlFor={`${name}-ssr`} className="text-sm font-medium flex-1">
                    {label}
                </Label>
            </div>
            <Switch id={`${name}-ssr`} checked={false} disabled={disabled} />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-between space-x-2 pt-2">
      <div className="flex items-center gap-1">
        <Label htmlFor={name} className="text-sm font-medium flex-1">
          {label}
        </Label>
        {tooltip && (
            <TooltipProvider>
              <Tooltip delayDuration={20}>
                <TooltipTrigger asChild>
                    <button type="button" tabIndex={-1} aria-label={`More information about ${label}`} className="cursor-help p-1 rounded-full hover:bg-muted -ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                </TooltipTrigger>
                 <TooltipContent
                    side="top"
                    className="max-w-xs text-sm bg-popover text-popover-foreground p-3 rounded-md shadow-md"
                    onPointerDownOutside={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest('[data-radix-tooltip-trigger]') || target.closest('[data-radix-popper-content-wrapper]')) {
                            event.preventDefault();
                        }
                    }}
                 >
                    <p dangerouslySetInnerHTML={{ __html: tooltip }} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        )}
      </div>
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Switch
                            id={name}
                            checked={field.value as boolean}
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (onValueChange) {
                                    onValueChange(checked);
                                }
                            }}
                            disabled={disabled}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    </div>
  );
};

const setDependentFieldDefault = (
  checked: boolean,
  fieldName: FieldPath<FormSchemaType>,
  defaultValue: number | undefined,
  localSetValue: UseFormSetValue<FormSchemaType>,
  localGetValues: UseFormGetValues<FormSchemaType>,
  localTrigger: UseFormTrigger<FormSchemaType>,
  affectedFieldsToTrigger?: FieldPath<FormSchemaType>[]
) => {
  if (checked) {
    const currentValue = localGetValues(fieldName);
    if (currentValue === undefined || currentValue === null || currentValue === '') {
      localSetValue(fieldName, defaultValue, { shouldValidate: false, shouldDirty: false, shouldTouch: false });
    }
  } else {
    localSetValue(fieldName, undefined, { shouldValidate: false, shouldDirty: false, shouldTouch: false });
  }
   const fieldsToActuallyTrigger: FieldPath<FormSchemaType>[] = [fieldName, ...(affectedFieldsToTrigger || [])];
   localTrigger(fieldsToActuallyTrigger).catch(error => console.warn("Error triggering fields in setDependentFieldDefault:", error, fieldName));
};


export function BusinessInputForm() {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [targets, setTargets] = useState<TargetAnalysis | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(true); // Ref to track initial load
  const firstCalculationDone = useRef(false); // Ref to track if first successful calculation has run


  const formMethods = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pricePerUnit: 1,
      expectedUnitsSold: 0,
      directVariableCostPerUnit: 0,
      salariesWages: 0,
      marketingCosts: 0,
      rentUtilities: 0,
      otherFixedCosts: 0, // Explicitly set because it's required by refine when includeDetailedFixedCosts is false

      includeDetailedFixedCosts: false,
      softwareSubscriptions: undefined,
      professionalFees: undefined,
      insurance: undefined,
      licensesAndPermits: undefined,
      otherDetailedFixedCosts: undefined, // Granular
      customFixedCosts: [],

      includeOtherVariableCosts: false,
      otherVariableCostsPercentage: undefined, // Simple percentage
      includeDetailedVariableCosts: false,
      salesCommissionsPercentage: undefined,
      variableShippingFulfillmentPercentage: undefined,
      otherSpecificVariableCostPercentage: undefined,
      customVariableCosts: [],

      includeInvestment: false,
      initialInvestment: undefined,
      includeTaxes: false,
      taxRate: undefined,
      includeLoan: false,
      loanPayment: undefined,
      includeDepreciation: false,
      depreciationAmortization: undefined,
      includePaymentProcessingFees: false,
      paymentProcessingFeeRate: undefined,
      includeReturnsRefunds: false,
      returnsRefundsRate: undefined,
      includeOwnerDraw: false,
      ownerDraw: undefined,
      desiredProfitMargin: undefined,
      timePeriod: 'monthly',
      currency: 'USD',
      customCurrency: "",
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    watch,
    formState,
    getValues,
    setValue,
    reset,
    trigger,
    setError,
    clearErrors,
  } = formMethods;

  const errors = formState.errors; // Consistently use this for error checks

  const { fields: customFixedCostFields, append: appendCustomFixedCost, remove: removeCustomFixedCost } = useFieldArray({
    control,
    name: "customFixedCosts",
  });

   const { fields: customVariableCostFields, append: appendCustomVariableCost, remove: removeCustomVariableCost } = useFieldArray({
    control,
    name: "customVariableCosts",
  });


  const runCalculations = useCallback(
    async (currentData?: FormSchemaType, isInitialAttempt: boolean = false, isSubmitAttempt: boolean = false) => {
      let formDataToValidate: FormSchemaType;

      if (currentData) {
          formDataToValidate = currentData;
      } else {
          // Fallback if currentData is not provided, though it should be from watch or submit
          const currentFormValues = getValues();
          formDataToValidate = {
              ...currentFormValues,
          };
      }

      const isValidOnRHFTrigger = await trigger().catch(error => {
          console.error("Error during RHF trigger() in runCalculations:", error);
          return false; // Assume invalid on error
      });

      const validationResult = await formSchema.safeParseAsync(formDataToValidate);

      if (validationResult.success) {
        if (!firstCalculationDone.current || isInitialAttempt) {
            // Clear all RHF errors if Zod validation passes, for the first successful calculation
            let unwrappedSchema: z.ZodTypeAny = formSchema;
            while (unwrappedSchema._def && (unwrappedSchema._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects || unwrappedSchema._def.typeName === z.ZodFirstPartyTypeKind.ZodPipeline)) {
                unwrappedSchema = unwrappedSchema._def.schema;
            }
            if (unwrappedSchema instanceof z.ZodObject && typeof unwrappedSchema.shape === 'object' && unwrappedSchema.shape !== null) {
              Object.keys(unwrappedSchema.shape).forEach(fieldName => {
                 clearErrors(fieldName as FieldPath<FormSchemaType>);
              });
            }
            clearErrors("root.form" as any); // Clear any form-level errors
        }

        const dataForCalc: BusinessInputData = {
            pricePerUnit: validationResult.data.pricePerUnit ?? 0,
            expectedUnitsSold: validationResult.data.expectedUnitsSold ?? 0,
            directVariableCostPerUnit: validationResult.data.directVariableCostPerUnit ?? 0,
            salariesWages: validationResult.data.salariesWages ?? 0,
            marketingCosts: validationResult.data.marketingCosts ?? 0,
            rentUtilities: validationResult.data.rentUtilities ?? 0,

            otherFixedCosts: !validationResult.data.includeDetailedFixedCosts ? (validationResult.data.otherFixedCosts ?? 0) : 0,
            softwareSubscriptions: validationResult.data.includeDetailedFixedCosts ? (validationResult.data.softwareSubscriptions ?? 0) : 0,
            professionalFees: validationResult.data.includeDetailedFixedCosts ? (validationResult.data.professionalFees ?? 0) : 0,
            insurance: validationResult.data.includeDetailedFixedCosts ? (validationResult.data.insurance ?? 0) : 0,
            licensesAndPermits: validationResult.data.includeDetailedFixedCosts ? (validationResult.data.licensesAndPermits ?? 0) : 0,
            otherDetailedFixedCosts: validationResult.data.includeDetailedFixedCosts ? (validationResult.data.otherDetailedFixedCosts ?? 0) : 0,
            customFixedCosts: validationResult.data.customFixedCosts || [],

            otherVariableCostsPercentage: validationResult.data.includeOtherVariableCosts && !validationResult.data.includeDetailedVariableCosts ? (validationResult.data.otherVariableCostsPercentage ?? 0) : 0,
            salesCommissionsPercentage: validationResult.data.includeDetailedVariableCosts ? (validationResult.data.salesCommissionsPercentage ?? 0) : 0,
            variableShippingFulfillmentPercentage: validationResult.data.includeDetailedVariableCosts ? (validationResult.data.variableShippingFulfillmentPercentage ?? 0) : 0,
            otherSpecificVariableCostPercentage: validationResult.data.includeDetailedVariableCosts ? (validationResult.data.otherSpecificVariableCostPercentage ?? 0) : 0,
            customVariableCosts: validationResult.data.customVariableCosts || [],

            includeInvestment: validationResult.data.includeInvestment ?? false,
            initialInvestment: validationResult.data.includeInvestment ? (validationResult.data.initialInvestment ?? 0) : 0,
            includeTaxes: validationResult.data.includeTaxes ?? false,
            taxRate: validationResult.data.includeTaxes ? (validationResult.data.taxRate ?? 0) : 0,
            includeLoan: validationResult.data.includeLoan ?? false,
            loanPayment: validationResult.data.includeLoan ? (validationResult.data.loanPayment ?? 0) : 0,
            includeDepreciation: validationResult.data.includeDepreciation ?? false,
            depreciationAmortization: validationResult.data.includeDepreciation ? (validationResult.data.depreciationAmortization ?? 0) : 0,
            includePaymentProcessingFees: validationResult.data.includePaymentProcessingFees ?? false,
            paymentProcessingFeeRate: validationResult.data.includePaymentProcessingFees ? (validationResult.data.paymentProcessingFeeRate ?? 0) : 0,
            includeReturnsRefunds: validationResult.data.includeReturnsRefunds ?? false,
            returnsRefundsRate: validationResult.data.includeReturnsRefunds ? (validationResult.data.returnsRefundsRate ?? 0) : 0,
            includeOwnerDraw: validationResult.data.includeOwnerDraw ?? false,
            ownerDraw: validationResult.data.ownerDraw ? (validationResult.data.ownerDraw ?? 0) : 0,
            desiredProfitMargin: validationResult.data.desiredProfitMargin,
            timePeriod: validationResult.data.timePeriod ?? 'monthly',
            currency: validationResult.data.currency === 'OTHER' ? (validationResult.data.customCurrency || '???') : (validationResult.data.currency || 'USD'),
            customCurrency: validationResult.data.customCurrency,
        };

        const profitabilityResults = calculateProfitability(dataForCalc);
        const targetResults = calculateTargets(dataForCalc);
        setResults(profitabilityResults);
        setTargets(targetResults);

        if (isInitialAttempt && !firstCalculationDone.current && isValidOnRHFTrigger) {
            toast({ title: "Analysis Ready", description: "Initial calculations complete." });
            firstCalculationDone.current = true;
        } else if (isSubmitAttempt && !isInitialAttempt) {
            toast({ title: "Analysis Updated", description: "Calculations updated based on your inputs." });
        }

    } else { // Zod validation failed
        const { fieldErrors, formErrors } = validationResult.error.flatten();
        const rawIssues = validationResult.error.issues;

        if (isInitialAttempt) {
             if (!isValidOnRHFTrigger && Object.keys(fieldErrors).length === 0 && formErrors.length === 0) {
                console.warn(
                    "Initial validation: RHF deemed form invalid, and Zod safeParse also failed without specific flattened errors. Raw Zod issues:", JSON.stringify(rawIssues, null, 2),
                    "Form Data used:", JSON.stringify(formDataToValidate, null, 2)
                );
                 setResults(null);
                 setTargets(null);
            }
            // For initial load, even if RHF is valid but Zod fails with specific errors, don't set UI errors yet.
            // Only set RHF errors IF RHF itself thought it was invalid.
             else if (!isValidOnRHFTrigger) {
                rawIssues.forEach(issue => {
                    const path = issue.path.join(".") as FieldPath<FormSchemaType>;
                    if (issue.path.length > 0) {
                        setError(path, { type: issue.code.toString(), message: issue.message });
                    } else {
                        setError("root.form" as any, { type: issue.code.toString(), message: issue.message });
                    }
                });
            }


        } else { // Not initial attempt (i.e., user input or submit)

            // Clear previous errors first
            let unwrappedSchema: z.ZodTypeAny = formSchema;
            while (unwrappedSchema._def && (unwrappedSchema._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects || unwrappedSchema._def.typeName === z.ZodFirstPartyTypeKind.ZodPipeline)) {
                unwrappedSchema = unwrappedSchema._def.schema;
            }
            if (unwrappedSchema instanceof z.ZodObject && typeof unwrappedSchema.shape === 'object' && unwrappedSchema.shape !== null) {
               Object.keys(unwrappedSchema.shape).forEach(fieldName => {
                  clearErrors(fieldName as FieldPath<FormSchemaType>);
               });
            }
            clearErrors("root.form" as any);

            // Set new errors from Zod
            rawIssues.forEach(issue => {
                const path = issue.path.join(".") as FieldPath<FormSchemaType>;
                if (issue.path.length > 0) {
                    setError(path, { type: issue.code.toString(), message: issue.message });
                } else {
                    setError("root.form" as any, { type: issue.code.toString(), message: issue.message });
                }
            });

            if (isSubmitAttempt) { // Only show toast on explicit submit failure
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please check your inputs. Some fields have errors.",
                });
            }
            setResults(null);
            setTargets(null);
        }
    }
    }, [getValues, setValue, toast, setError, clearErrors, trigger, reset] // Added reset
  );

  const onSubmitRHF = (data: FormSchemaType) => {
    runCalculations(data, false, true);
  };

  // Effect for initial calculation
  useEffect(() => {
    const calculateInitial = async () => {
        if (initialLoadRef.current && typeof window !== "undefined") {
            await trigger(); // This should set RHF's formState.isValid correctly
            runCalculations(getValues(), true, false); // Pass current form values
            initialLoadRef.current = false;
        }
    };
    const timer = setTimeout(calculateInitial, 100); // Slight delay to ensure RHF has initialized
    return () => clearTimeout(timer);
  }, [getValues, runCalculations, trigger]); // Dependencies for initial calculation

  // Debounced runCalculations for watch
  const debouncedRunCalculations = useCallback(
    debounce((data: FormSchemaType) => {
      if (!initialLoadRef.current) { // Don't run for the very first `watch` call if initial load hasn't happened
        runCalculations(data, false, false);
      }
    }, 300),
    [runCalculations] // runCalculations is memoized
  );

  // Watch for all form changes to trigger live updates
  useEffect(() => {
    const subscription = watch((values) => {
      debouncedRunCalculations(values as FormSchemaType);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedRunCalculations]);


  const handleSaveScenario = () => {
    const formData = getValues();
    const jsonString = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'profitability-scenario.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Scenario Saved", description: "Your current inputs have been downloaded." });
  };

  const handleLoadScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          let loadedData = JSON.parse(json) as Partial<FormSchemaType>;

          // Get Zod schema defaults
          let currentSchemaForDefaults: z.ZodTypeAny = formSchema;
          while (currentSchemaForDefaults._def && (currentSchemaForDefaults._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects || currentSchemaForDefaults._def.typeName === z.ZodFirstPartyTypeKind.ZodPipeline)) {
              currentSchemaForDefaults = currentSchemaForDefaults._def.schema;
          }
          const schemaDefaults = currentSchemaForDefaults.parse({}); // This gets defaults defined in z.object({}).default(...)

          // Merge loaded data with schema defaults, then RHF defaults (for fields not in schema defaults)
          const mergedDataWithSchemaDefaults: FormSchemaType = {
            ...(schemaDefaults as FormSchemaType), // Zod defaults first
            ...formMethods.formState.defaultValues, // Then RHF defaults
            ...loadedData, // Then loaded data
            // Ensure arrays are initialized if missing in loaded data but present in schema
            customFixedCosts: loadedData.customFixedCosts || (schemaDefaults as FormSchemaType).customFixedCosts || [],
            customVariableCosts: loadedData.customVariableCosts || (schemaDefaults as FormSchemaType).customVariableCosts || [],
          };


          // Coerce specific fields to number or undefined
          const fieldsToCoerce: (keyof FormSchemaType)[] = [
                'pricePerUnit', 'expectedUnitsSold', 'directVariableCostPerUnit', 'salariesWages', 'marketingCosts', 'rentUtilities',
                'otherFixedCosts', 'softwareSubscriptions', 'professionalFees', 'insurance', 'licensesAndPermits', 'otherDetailedFixedCosts',
                'otherVariableCostsPercentage', 'salesCommissionsPercentage', 'variableShippingFulfillmentPercentage', 'otherSpecificVariableCostPercentage',
                'initialInvestment', 'taxRate', 'loanPayment', 'depreciationAmortization', 'paymentProcessingFeeRate',
                'returnsRefundsRate', 'ownerDraw', 'desiredProfitMargin'
            ];

            (mergedDataWithSchemaDefaults.customFixedCosts || []).forEach(cost => {
                if (cost.amount === null || cost.amount === "" || cost.amount === undefined) cost.amount = undefined;
                else if (typeof cost.amount === 'string') {
                   const numVal = Number(cost.amount);
                   cost.amount = Number.isNaN(numVal) ? undefined : numVal;
                } else if (typeof cost.amount !== 'number') {
                   cost.amount = undefined;
                }
            });
            (mergedDataWithSchemaDefaults.customVariableCosts || []).forEach(cost => {
                if (cost.percentage === null || cost.percentage === "" || cost.percentage === undefined) cost.percentage = undefined;
                else if (typeof cost.percentage === 'string') {
                    const numVal = Number(cost.percentage);
                    cost.percentage = Number.isNaN(numVal) ? undefined : numVal;
                } else if (typeof cost.percentage !== 'number') {
                    cost.percentage = undefined;
                }
            });

            fieldsToCoerce.forEach(field => {
                const value = (mergedDataWithSchemaDefaults as any)[field];
                if (value === null || value === "") { // Treat empty string from JSON as undefined for optional numbers
                    (mergedDataWithSchemaDefaults as any)[field] = undefined;
                } else if (value !== undefined && typeof value === 'string') { // If it's a string, try to convert to number
                    const numVal = Number(value);
                    (mergedDataWithSchemaDefaults as any)[field] = Number.isNaN(numVal) ? undefined : numVal; // If NaN, set to undefined
                } else if (value !== undefined && typeof value !== 'number') { // If it's some other non-number type (shouldn't happen often)
                    (mergedDataWithSchemaDefaults as any)[field] = undefined;
                }
            });


          const validation = await formSchema.safeParseAsync(mergedDataWithSchemaDefaults);

          if (validation.success) {
            reset(validation.data); // Reset form with validated and defaulted data
             setTimeout(async () => {
                await trigger(); // Trigger validation for RHF state
                runCalculations(getValues(), false, false); // Recalculate with the new, validated data
            }, 0);
            toast({ title: "Scenario Loaded", description: "Inputs have been populated from the file." });
          } else {
            console.error("Loaded data validation errors (raw Zod issues):", JSON.stringify(validation.error.issues, null, 2));
             let currentSchemaForErrorClear: z.ZodTypeAny = formSchema;
             while (currentSchemaForErrorClear._def && (currentSchemaForErrorClear._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects || currentSchemaForErrorClear._def.typeName === z.ZodFirstPartyTypeKind.ZodPipeline)) {
                currentSchemaForErrorClear = currentSchemaForErrorClear._def.schema;
            }
            if (currentSchemaForErrorClear instanceof z.ZodObject && typeof currentSchemaForErrorClear.shape === 'object' && currentSchemaForErrorClear.shape !== null) {
                Object.keys(currentSchemaForErrorClear.shape).forEach(fieldName => {
                    clearErrors(fieldName as FieldPath<FormSchemaType>);
                });
            }
            clearErrors("root.form" as any);

            validation.error.issues.forEach(issue => {
                const path = issue.path.join(".") as FieldPath<FormSchemaType>;
                 if (issue.path.length > 0) {
                    setError(path, { type: issue.code.toString(), message: issue.message });
                } else {
                    setError("root.form" as any, { type: issue.code.toString(), message: issue.message });
                }
            });
            toast({ variant: "destructive", title: "Load Error", description: "Loaded scenario data is invalid. Please check the file or console for details." });
          }
        } catch (error) {
          console.error("Error loading scenario:", error);
          toast({ variant: "destructive", title: "Load Error", description: "Could not read or parse the scenario file." });
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const formatAndDownloadCSV = (currentData: FormSchemaType, currentResults: CalculationResults | null, currentTargets: TargetAnalysis | null) => {
    if (!currentResults || !currentTargets) {
        toast({ variant: "destructive", title: "No Data", description: "Please run an analysis before downloading." });
        return;
    }
    const displayCurr = currentData.currency === 'OTHER' ? (currentData.customCurrency || '???') : currentData.currency;
    const periodLbl = currentData.timePeriod === 'monthly' ? 'Month' : 'Year';

    let csvContent = "Category,Item,Value,Units\n";
    csvContent += `Inputs,Time Period,${currentData.timePeriod || ''},\n`;
    csvContent += `Inputs,Currency,${displayCurr || ''},\n`;
    csvContent += `Inputs,Price Per Unit,${currentData.pricePerUnit ?? ''},${displayCurr}\n`;
    csvContent += `Inputs,Expected Units Sold,${currentData.expectedUnitsSold ?? ''},units per ${periodLbl}\n`;
    csvContent += `Inputs,Direct Variable Cost Per Unit,${currentData.directVariableCostPerUnit ?? ''},${displayCurr}\n`;
    csvContent += `Inputs,Salaries & Wages,${currentData.salariesWages ?? 0},${displayCurr} per ${periodLbl}\n`;
    csvContent += `Inputs,Marketing Costs,${currentData.marketingCosts ?? 0},${displayCurr} per ${periodLbl}\n`;
    csvContent += `Inputs,Rent & Utilities,${currentData.rentUtilities ?? 0},${displayCurr} per ${periodLbl}\n`;

    if (currentData.includeDetailedFixedCosts) {
        csvContent += `Inputs,Software Subscriptions,${currentData.softwareSubscriptions ?? 0},${displayCurr} per ${periodLbl}\n`;
        csvContent += `Inputs,Professional Fees,${currentData.professionalFees ?? 0},${displayCurr} per ${periodLbl}\n`;
        csvContent += `Inputs,Insurance,${currentData.insurance ?? 0},${displayCurr} per ${periodLbl}\n`;
        csvContent += `Inputs,Licenses & Permits,${currentData.licensesAndPermits ?? 0},${displayCurr} per ${periodLbl}\n`;
        csvContent += `Inputs,Other Detailed Fixed Costs,${currentData.otherDetailedFixedCosts ?? 0},${displayCurr} per ${periodLbl}\n`;
        (currentData.customFixedCosts || []).forEach(cost => {
            csvContent += `Inputs,Custom Fixed Cost: ${cost.name.replace(/,/g, ';')},${cost.amount ?? 0},${displayCurr} per ${periodLbl}\n`;
        });
    } else {
        csvContent += `Inputs,Other Fixed Costs (General),${currentData.otherFixedCosts ?? 0},${displayCurr} per ${periodLbl}\n`;
    }

    if (currentData.includeDetailedVariableCosts) {
        csvContent += `Inputs,Sales Commissions Rate,${currentData.salesCommissionsPercentage ?? 0},%\n`;
        csvContent += `Inputs,Variable Shipping/Fulfillment Rate,${currentData.variableShippingFulfillmentPercentage ?? 0},%\n`;
        csvContent += `Inputs,Other Specific Variable Cost Rate,${currentData.otherSpecificVariableCostPercentage ?? 0},%\n`;
         (currentData.customVariableCosts || []).forEach(cost => {
            csvContent += `Inputs,Custom Variable Cost: ${cost.name.replace(/,/g, ';')},${cost.percentage ?? 0},%\n`;
        });
    } else if (currentData.includeOtherVariableCosts) {
        csvContent += `Inputs,Other Variable Costs Rate (General),${currentData.otherVariableCostsPercentage ?? ''},%\n`;
    }


    if (currentData.includeInvestment) csvContent += `Inputs,Initial Investment,${currentData.initialInvestment ?? ''},${displayCurr}\n`;
    if (currentData.includeTaxes) csvContent += `Inputs,Tax Rate,${currentData.taxRate ?? ''},%\n`;
    if (currentData.includeLoan) csvContent += `Inputs,Loan Payment,${currentData.loanPayment ?? ''},${displayCurr} per ${periodLbl}\n`;
    if (currentData.includeDepreciation) csvContent += `Inputs,Depreciation/Amortization,${currentData.depreciationAmortization ?? ''},${displayCurr} per ${periodLbl}\n`;
    if (currentData.includePaymentProcessingFees) csvContent += `Inputs,Payment Processing Fee Rate,${currentData.paymentProcessingFeeRate ?? ''},%\n`;
    if (currentData.includeReturnsRefunds) csvContent += `Inputs,Returns/Refunds Rate,${currentData.returnsRefundsRate ?? ''},%\n`;
    if (currentData.includeOwnerDraw) csvContent += `Inputs,Owner Draw,${currentData.ownerDraw ?? ''},${displayCurr} per ${periodLbl}\n`;
    if (currentData.desiredProfitMargin !== undefined) csvContent += `Inputs,Desired Profit Margin,${currentData.desiredProfitMargin ?? ''},%\n`;
    csvContent += "\n";

    // Results
    const formattedDisplayResults = formatResults(currentResults, displayCurr);
    csvContent += "Profitability Analysis,Net Profit," + formattedDisplayResults.netProfit + ",\n";
    csvContent += "Profitability Analysis,Is Profitable?," + formattedDisplayResults.isProfitable + ",\n";
    csvContent += "Profitability Analysis,Profit Margin," + formattedDisplayResults.profitMargin + ",\n";
    if (currentResults.roi !== 'N/A') csvContent += "Profitability Analysis,ROI," + formattedDisplayResults.roi + ",\n";
    csvContent += `Profitability Analysis,Break-Even Units,${formattedDisplayResults.breakEvenUnits},units per ${periodLbl}\n`;
    csvContent += "Profitability Analysis,Break-Even Revenue," + formattedDisplayResults.breakEvenRevenue + ",\n";
    csvContent += "Profitability Analysis,Gross Revenue," + formattedDisplayResults.totalRevenue + ",\n";
    csvContent += "Profitability Analysis,Revenue After Returns," + formattedDisplayResults.revenueAfterReturns + ",\n";
    csvContent += "Profitability Analysis,Total Variable Costs," + formattedDisplayResults.totalVariableCosts + ",\n";
    csvContent += "Profitability Analysis,Contribution Margin," + formattedDisplayResults.contributionMargin + ",\n";
    csvContent += "Profitability Analysis,Total Fixed & Op. Costs," + formattedDisplayResults.totalFixedCosts + ",\n";
    csvContent += "Profitability Analysis,Profit Before Tax," + formattedDisplayResults.profitBeforeTax + ",\n";
     if (currentResults.taxesPaid > 0 && formattedDisplayResults.taxesPaid !== formatCurrency(0, displayCurr)) {
         csvContent += "Profitability Analysis,Taxes Paid," + formattedDisplayResults.taxesPaid + ",\n";
    }
    csvContent += "\n";

    // Targets
    csvContent += `Target Analysis (Break-Even),Units to Sell,${currentTargets.unitsToBreakEven || 'N/A'},units per ${periodLbl}\n`;
    csvContent += `Target Analysis (Break-Even),Price per Unit,${currentTargets.priceToBreakEven || 'N/A'},${displayCurr}\n`;
    csvContent += `Target Analysis (Break-Even),Direct Variable Cost Reduction By,${currentTargets.directVariableCostReductionToBreakEven || 'N/A'},${displayCurr}\n`;
    csvContent += `Target Analysis (Break-Even),Fixed Costs Reduction By,${currentTargets.fixedCostReductionToBreakEven || 'N/A'},${displayCurr}\n`;

    if (currentData.desiredProfitMargin !== undefined && currentData.desiredProfitMargin > 0 && currentTargets.unitsForDesiredMargin !== undefined) {
        csvContent += `Target Analysis (${currentData.desiredProfitMargin}% Margin),Units to Sell,${currentTargets.unitsForDesiredMargin || 'N/A'},units per ${periodLbl}\n`;
        csvContent += `Target Analysis (${currentData.desiredProfitMargin}% Margin),Price per Unit,${currentTargets.priceForDesiredMargin || 'N/A'},${displayCurr}\n`;
        csvContent += `Target Analysis (${currentData.desiredProfitMargin}% Margin),Direct Variable Cost Reduction By,${currentTargets.directVariableCostReductionForDesiredMargin || 'N/A'},${displayCurr}\n`;
        csvContent += `Target Analysis (${currentData.desiredProfitMargin}% Margin),Fixed Costs Reduction By,${currentTargets.fixedCostReductionForDesiredMargin || 'N/A'},${displayCurr}\n`;
        if (currentTargets.calculatedTargetProfit) csvContent += `Target Analysis (${currentData.desiredProfitMargin}% Margin),Calculated Target Profit,${currentTargets.calculatedTargetProfit},${displayCurr}\n`;
    }


    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'profitability_analysis_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Report Downloaded", description: "CSV report has been generated." });
  };

  const formatResults = (currentResults: CalculationResults | null, displayCurr: string) => {
      if (!currentResults) {
          return {
              netProfit: '', isProfitable: '', profitMargin: '', roi: '',
              breakEvenUnits: '', breakEvenRevenue: '', totalRevenue: '', revenueAfterReturns: '',
              totalVariableCosts: '', contributionMargin: '', totalFixedCosts: '', profitBeforeTax: '',
              taxesPaid: ''
          };
      }
      return {
          netProfit: formatCurrency(currentResults.netProfit, displayCurr),
          isProfitable: currentResults.isProfitable ? 'Yes' : 'No',
          profitMargin: formatPercentage(currentResults.profitMargin),
          roi: currentResults.roi === 'N/A' ? 'N/A' : formatPercentage(currentResults.roi),
          breakEvenUnits: formatUnits(currentResults.breakEvenUnits),
          breakEvenRevenue: formatCurrency(currentResults.breakEvenRevenue, displayCurr),
          totalRevenue: formatCurrency(currentResults.totalRevenue, displayCurr),
          revenueAfterReturns: formatCurrency(currentResults.revenueAfterReturns, displayCurr),
          totalVariableCosts: formatCurrency(currentResults.totalVariableCosts, displayCurr),
          contributionMargin: formatCurrency(currentResults.contributionMargin, displayCurr),
      };
  };

  const handleDownloadPDFClick = () => {
    console.log("PDF Download clicked - not implemented yet");
    toast({ title: "Coming Soon", description: "PDF report download will be available in a future update." });
  };


  const includeInvestmentWatch = watch('includeInvestment');
  const includeTaxesWatch = watch('includeTaxes');
  const includeLoanWatch = watch('includeLoan');
  const includeDepreciationWatch = watch('includeDepreciation');

  const includeOtherVariableCostsWatch = watch('includeOtherVariableCosts');
  const includeDetailedFixedCostsWatch = watch('includeDetailedFixedCosts');
  const includeDetailedVariableCostsWatch = watch('includeDetailedVariableCosts');

  const includePaymentProcessingFeesWatch = watch('includePaymentProcessingFees');
  const includeReturnsRefundsWatch = watch('includeReturnsRefunds');
  const includeOwnerDrawWatch = watch('includeOwnerDraw');
  const timePeriodWatch = watch('timePeriod');
  const selectedCurrencyWatch = watch('currency');
  const customCurrencyValue = watch('customCurrency');


  const displayCurrency = selectedCurrencyWatch === 'OTHER' ? (customCurrencyValue || '???') : (selectedCurrencyWatch || 'USD');
  const periodLabel = timePeriodWatch === 'monthly' ? 'Month' : 'Year';


  return (
    <Form {...formMethods}>
      <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
          <div className="flex flex-wrap justify-end gap-2 mb-4">
              <Button className='blue' type="button" variant="outline" onClick={handleSaveScenario}><FileDown className="mr-2 h-4 w-4" /> Save Scenario</Button>
              <Button className='blue' type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" /> Load Scenario</Button>
              <input type="file" ref={fileInputRef} onChange={handleLoadScenario} accept=".json" style={{ display: 'none' }} />
              <Button className='blue' type="button" variant="outline" onClick={() => formatAndDownloadCSV(getValues(), results, targets)}><FileTextIcon className="mr-2 h-4 w-4" /> Download CSV</Button>
              <Button className='blue' type="button" variant="outline" onClick={handleDownloadPDFClick}><FileTextIcon className="mr-2 h-4 w-4" /> Download PDF</Button>
          </div>

        <form onSubmit={rhfHandleSubmit(onSubmitRHF)} className="space-y-6">

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Set the time period and currency for your analysis.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-muted-foreground" /> Time Period
                        </FormLabel>
                         <TooltipProvider>
                            <Tooltip delayDuration={20}>
                                <TooltipTrigger asChild>
                                    <button type="button" tabIndex={-1} aria-label="More information about Time Period" className="cursor-help p-1 rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="max-w-xs text-sm bg-popover text-popover-foreground p-3 rounded-md shadow-md"
                                    onPointerDownOutside={(event) => {
                                        const target = event.target as HTMLElement;
                                        if (target.closest('[data-radix-tooltip-trigger]') || target.closest('[data-radix-popper-content-wrapper]')) {
                                            event.preventDefault();
                                        }
                                    }}
                                >
                                    <p dangerouslySetInnerHTML={{ __html: "Select the time frame (monthly or annually) for your financial inputs (costs, sales volume). All calculations and results (profit, break-even point, targets) will be based on this period. Ensure all your cost and revenue figures align with the chosen timeframe. <br><b>Example:</b> If you select 'Monthly', enter your monthly rent, monthly salaries, and expected monthly unit sales." }} />
                                </TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    </div>
                    <FormField
                      control={control}
                      name="timePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    // runCalculations(getValues(), false, false); // Removed due to explicit button
                                }}
                                value={field.value}
                                className="flex space-x-4"
                            >
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="monthly" id="timePeriod-monthly" /></FormControl>
                                    <FormLabel htmlFor="timePeriod-monthly" className="font-normal">Monthly</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="annually" id="timePeriod-annually" /></FormControl>
                                    <FormLabel htmlFor="timePeriod-annually" className="font-normal">Annually</FormLabel>
                                </FormItem>
                            </RadioGroup>
                          </FormControl>
                           <FormMessage>{(errors?.timePeriod as { message?: string })?.message || ''}</FormMessage>
                        </FormItem>
                        )}
                    />
                  </div>
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="currency" className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="h-4 w-4 text-muted-foreground" /> Currency
                          </Label>
                           <TooltipProvider>
                              <Tooltip delayDuration={20}>
                                  <TooltipTrigger asChild>
                                      <button type="button" tabIndex={-1} aria-label="More information about Currency" className="cursor-help p-1 rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                          <Info className="h-4 w-4 text-muted-foreground" />
                                      </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                        side="top"
                                        className="max-w-xs text-sm bg-popover text-popover-foreground p-3 rounded-md shadow-md"
                                        onPointerDownOutside={(event) => {
                                            const target = event.target as HTMLElement;
                                            if (target.closest('[data-radix-tooltip-trigger]') || target.closest('[data-radix-popper-content-wrapper]')) {
                                                event.preventDefault();
                                            }
                                        }}
                                  >
                                      <p dangerouslySetInnerHTML={{ __html: "Select the primary currency for all monetary inputs (prices, costs). Results like Net Profit and Break-Even Revenue will be displayed in this currency. If your currency isn't listed, choose 'Other...' and enter its standard 3-letter code (e.g., SEK, BRL) or symbol (e.g., ¥, £). <br><b>Example:</b> If your business operates in Canada, select 'CAD'."}} />
                                  </TooltipContent>
                              </Tooltip>
                           </TooltipProvider>
                        </div>
                      <FormField
                        control={control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value !== 'OTHER') { setValue('customCurrency', ''); }
                                  // runCalculations(getValues(), false, false); // Removed due to explicit button
                                }}
                                value={field.value}
                              >
                              <FormControl>
                                <SelectTrigger id="currency" className={errors?.currency ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectScrollUpButton />
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="NOK">NOK (NOK)</SelectItem>
                                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                                  <SelectItem value="INR">INR (₹)</SelectItem>
                                  <SelectItem value="OTHER">Other...</SelectItem>
                                <SelectScrollDownButton />
                              </SelectContent>
                            </Select>
                             <FormMessage>{(errors?.currency as { message?: string })?.message || ''}</FormMessage>
                          </FormItem>
                          )}
                    />
                    {selectedCurrencyWatch === 'OTHER' && (
                        <InputField
                            name="customCurrency"
                            label="Custom Currency (e.g., SEK)"
                            control={control}
                            errors={errors}
                            icon={DollarSign}
                            placeholder="e.g., SEK or R$"
                            type="text"
                            step={undefined}
                            tooltip="Enter the official 3-letter currency code (like 'SEK', 'BRL') or a common currency symbol (like '₪', 'kr'). Consistency is key for correct formatting. Example: For Swedish Krona, enter 'SEK'."
                            onValueCommitted={undefined} // No auto calc
                          />
                    )}
                  </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Revenue &amp; Direct Costs</CardTitle>
                <CardDescription>Core sales and direct production/service costs per unit.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField name="pricePerUnit" label="Selling Price per Unit" control={control} errors={errors} icon={DollarSign} placeholder="e.g., 49.99" tooltip="The amount you charge a customer for one unit of your product or service, before any discounts or returns. <br><b>Example:</b> If you sell coffee mugs for $15 each, enter 15." />
                  <InputField name="expectedUnitsSold" label={`Expected Units Sold (per ${periodLabel})`} control={control} errors={errors} icon={Package} placeholder="e.g., 500" type="number" step="1" tooltip={`Estimate the total number of units you plan to sell in the selected time period (${periodLabel}). This is crucial for forecasting revenue. <br><b>Example:</b> If you expect to sell 200 mugs per month, enter 200.`} />
                  <InputField name="directVariableCostPerUnit" label="Direct Variable Cost per Unit" control={control} errors={errors} icon={Percent} placeholder="e.g., 12.50" tooltip="Costs directly tied to producing or delivering one unit. These change proportionally with sales volume. Includes materials, direct labor, and unit-specific overhead. <br><b>Example:</b> For a mug, this might be the blank mug cost ($3), printing ($2), and a portion of packaging ($0.50). Total = $5.50." />

                  <div className="md:col-span-2 space-y-4 border-t pt-4">
                     <ToggleField
                        control={control}
                        name="includeOtherVariableCosts"
                        label="Include Other Variable Costs (Simple %)"
                        tooltip="Enable if you have other variable costs you prefer to estimate as a single percentage of your revenue after returns. If you enable 'Detailed Variable Costs' below, this field will be ignored."
                        onValueChange={(checked) => {
                            setDependentFieldDefault(checked, 'otherVariableCostsPercentage', 0, setValue, getValues, trigger, ['includeDetailedVariableCosts', 'salesCommissionsPercentage', 'variableShippingFulfillmentPercentage', 'otherSpecificVariableCostPercentage', 'customVariableCosts']);
                            if (checked) {
                                setValue('includeDetailedVariableCosts', false);
                                setValue('salesCommissionsPercentage', undefined);
                                setValue('variableShippingFulfillmentPercentage', undefined);
                                setValue('otherSpecificVariableCostPercentage', undefined);
                                setValue('customVariableCosts', []);
                            }
                           trigger(['otherVariableCostsPercentage','includeDetailedVariableCosts']);
                        }}
                    />
                    {includeOtherVariableCostsWatch && !watch('includeDetailedVariableCosts') && (
                    <InputField name="otherVariableCostsPercentage" label="Other Variable Costs (% of Adjusted Revenue)" control={control} errors={errors} icon={Percent} placeholder="e.g., 5" step="0.1" tooltip="Enter the total percentage these other variable costs represent relative to your revenue after accounting for returns. This is used if 'Detailed Variable Costs' is OFF. <br><b>Example:</b> If various uncategorized variable costs amount to 5% of adjusted revenue, enter 5." />
                    )}

                    <ToggleField
                        control={control}
                        name="includeDetailedVariableCosts"
                        label="Include Detailed Variable Costs?"
                        tooltip="Enable to specify different types of variable costs as individual percentages of revenue after returns. If this is enabled, the 'Other Variable Costs (Simple %)' field above is ignored."
                         onValueChange={(checked) => {
                           if (checked) {
                                setValue('includeOtherVariableCosts', false);
                                setValue('otherVariableCostsPercentage', undefined);
                                const detailedVarFields: FieldPath<FormSchemaType>[] = ['salesCommissionsPercentage', 'variableShippingFulfillmentPercentage', 'otherSpecificVariableCostPercentage'];
                                detailedVarFields.forEach(field => { if (getValues(field) === undefined) setValue(field, 0); });
                                if (!getValues('customVariableCosts') || !Array.isArray(getValues('customVariableCosts'))) setValue('customVariableCosts', []);
                           } else {
                                setValue('salesCommissionsPercentage', undefined);
                                setValue('variableShippingFulfillmentPercentage', undefined);
                                setValue('otherSpecificVariableCostPercentage', undefined);
                                setValue('customVariableCosts', []);
                           }
                           trigger(['includeDetailedVariableCosts', 'salesCommissionsPercentage', 'variableShippingFulfillmentPercentage', 'otherSpecificVariableCostPercentage', 'customVariableCosts', 'includeOtherVariableCosts', 'otherVariableCostsPercentage']);
                        }}
                    />
                    {watch('includeDetailedVariableCosts') && (
                        <>
                            <InputField name="salesCommissionsPercentage" label="Sales Commissions (% of Adj. Revenue)" control={control} errors={errors} icon={UsersRound} placeholder="e.g., 10" step="0.1" tooltip="Percentage of revenue (after returns) paid as commissions to sales staff or affiliates. <br><b>Example:</b> If you pay a 10% commission on sales, enter 10." />
                            <InputField name="variableShippingFulfillmentPercentage" label="Shipping/Fulfillment (% of Adj. Revenue)" control={control} errors={errors} icon={Ship} placeholder="e.g., 8" step="0.1" tooltip="Variable costs associated with shipping products or fulfilling services, as a percentage of revenue after returns. <br><b>Example:</b> If average shipping costs are 8% of the sale price, enter 8."/>
                            <InputField name="otherSpecificVariableCostPercentage" label="Other Specific Variable Costs (% of Adj. Revenue)" control={control} errors={errors} icon={ShoppingBag} placeholder="e.g., 2" step="0.1" tooltip="Any other variable costs not covered above, expressed as a percentage of revenue after returns. <br><b>Example:</b> Royalties or licensing fees that are 2% of sales, enter 2." />

                             <div className="space-y-3 pt-2">
                                <Label className="text-sm font-medium">Custom Variable Costs (% of Adj. Revenue)</Label>
                                {customVariableCostFields.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <InputField
                                            name={`customVariableCosts.${index}.name`}
                                            label=""
                                            control={control}
                                            errors={errors}
                                            icon={Percent} // Placeholder, can be more specific
                                            type="text"
                                            placeholder="Cost Name (e.g., Royalties)"
                                            className="flex-1"
                                        />
                                        <InputField
                                            name={`customVariableCosts.${index}.percentage`}
                                            label=""
                                            control={control}
                                            errors={errors}
                                            icon={Percent}
                                            type="number"
                                            placeholder="%"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            className="w-24"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => {removeCustomVariableCost(index); trigger("customVariableCosts");}} aria-label="Remove custom variable cost">
                                            <XCircle className="h-5 w-5 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => {appendCustomVariableCost({ name: '', percentage: 0 }); trigger("customVariableCosts");}}>
                                   <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Variable Cost
                                </Button>
                            </div>
                        </>
                    )}
                  </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Fixed Operating Costs ({periodLabel}ly)</CardTitle>
                <CardDescription>Regular expenses not directly tied to production volume.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField name="salariesWages" label="Salaries & Wages" control={control} errors={errors} icon={Users} placeholder="e.g., 8000" tooltip={`Total gross compensation for all employees (including payroll taxes/benefits paid by the employer) for the selected period (${periodLabel}). Exclude owner's draw if you're tracking that separately below. <br><b>Example:</b> Total monthly payroll cost is $8,000.`}/>
                  <InputField name="marketingCosts" label="Marketing & Advertising" control={control} errors={errors} icon={Megaphone} placeholder="e.g., 1000" tooltip={`Total spending on promotional activities for the ${periodLabel}. Includes costs like online ads (Google, Facebook), social media management tools or fees, content creation, print materials, etc. <br><b>Example:</b> Monthly ad spend of $700 + SEO tool $100 + Flyer printing $200 = $1000.`} />
                  <InputField name="rentUtilities" label="Rent & Utilities" control={control} errors={errors} icon={Home} placeholder="e.g., 2500" tooltip={`Cost of your physical workspace (office, shop) and associated utilities (electricity, water, internet, gas) for the ${periodLabel}. Include property taxes/insurance if paid as part of rent. <br><b>Example:</b> Monthly office rent $2000 + Electricity $150 + Internet $100 + Water $50 = $2300.`} />

                  <div className="md:col-span-2 space-y-4 border-t pt-4">
                    <ToggleField
                        control={control}
                        name="includeDetailedFixedCosts"
                        label="Use Detailed Other Fixed Costs?"
                        tooltip="Enable to break down 'Other Fixed Costs' into more specific categories. If disabled, you'll use a single 'Other Fixed Costs (General)' field."
                        onValueChange={(checked) => {
                            if (checked) {
                                setValue('otherFixedCosts', undefined); // Clear general if detailed is on
                                const detailedFields: FieldPath<FormSchemaType>[] = ['softwareSubscriptions', 'professionalFees', 'insurance', 'licensesAndPermits', 'otherDetailedFixedCosts'];
                                detailedFields.forEach(field => { if (getValues(field) === undefined) setValue(field, 0); });
                                if (!getValues('customFixedCosts') || !Array.isArray(getValues('customFixedCosts'))) setValue('customFixedCosts', []);

                            } else {
                                setValue('softwareSubscriptions', undefined);
                                setValue('professionalFees', undefined);
                                setValue('insurance', undefined);
                                setValue('licensesAndPermits', undefined);
                                setValue('otherDetailedFixedCosts', undefined);
                                setValue('customFixedCosts', []);
                                if (getValues('otherFixedCosts') === undefined) setValue('otherFixedCosts', 0); // Set general to 0 if detailed is off and general is undefined
                            }
                            trigger(['includeDetailedFixedCosts', 'softwareSubscriptions', 'professionalFees', 'insurance', 'licensesAndPermits', 'otherDetailedFixedCosts', 'customFixedCosts', 'otherFixedCosts']);
                        }}
                    />
                    {includeDetailedFixedCostsWatch ? (
                        <>
                            <InputField name="softwareSubscriptions" label="Software Subscriptions" control={control} errors={errors} icon={Tv} placeholder="e.g., 200" tooltip={`Monthly or ${periodLabel}ly cost for all business software (CRM, accounting, project management, etc.). <br><b>Example:</b> CRM $100/mo + Accounting $50/mo + Design Tool $50/mo = $200/mo.`} />
                            <InputField name="professionalFees" label="Professional Fees (Legal, Accounting)" control={control} errors={errors} icon={HelpingHand} placeholder="e.g., 300" tooltip={`Fees paid for legal, accounting, consulting, or other professional services on a recurring basis for the ${periodLabel}. <br><b>Example:</b> Monthly retainer for an accountant $300.`} />
                            <InputField name="insurance" label="Business Insurance" control={control} errors={errors} icon={ShieldCheck} placeholder="e.g., 150" tooltip={`Premiums for business liability, property, or other relevant insurance policies for the ${periodLabel}. <br><b>Example:</b> Monthly general liability insurance premium $150.`} />
                            <InputField name="licensesAndPermits" label="Licenses &amp; Permits" control={control} errors={errors} icon={FileTextIcon} placeholder="e.g., 50" tooltip={`Recurring costs for business licenses, permits, or regulatory fees for the ${periodLabel}. <br><b>Example:</b> Annual business license costing $600, so $50 if period is monthly.`} />
                            <InputField name="otherDetailedFixedCosts" label="Other Detailed Fixed Costs" control={control} errors={errors} icon={Settings} placeholder="e.g., 100" tooltip={`Any other specific fixed costs for the ${periodLabel} not covered above. <br><b>Example:</b> Bank fees, office cleaning services, etc., totaling $100 monthly.`} />

                            <div className="space-y-3 pt-2">
                                <Label className="text-sm font-medium">Custom Fixed Costs</Label>
                                {customFixedCostFields.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <InputField
                                            name={`customFixedCosts.${index}.name`}
                                            label="" // No visible label needed here
                                            control={control}
                                            errors={errors}
                                            icon={DollarSign} // Or a generic icon
                                            type="text"
                                            placeholder="Cost Name (e.g., Bank Fees)"
                                            className="flex-1"
                                        />
                                        <InputField
                                            name={`customFixedCosts.${index}.amount`}
                                            label="" // No visible label
                                            control={control}
                                            errors={errors}
                                            icon={DollarSign}
                                            type="number"
                                            placeholder="Amount"
                                            step="0.01"
                                            min="0"
                                            className="w-32" // Adjust width as needed
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => {removeCustomFixedCost(index); trigger("customFixedCosts");}} aria-label="Remove custom fixed cost">
                                            <XCircle className="h-5 w-5 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => {appendCustomFixedCost({ name: '', amount: 0 }); trigger("customFixedCosts");}}>
                                   <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Fixed Cost
                                </Button>
                            </div>
                        </>
                    ) : (
                        <InputField name="otherFixedCosts" label="Other Fixed Costs (General)" control={control} errors={errors} icon={SquareMinus} placeholder="e.g., 750" tooltip={`Sum of all other recurring fixed expenses for the ${periodLabel} not listed above, if not using detailed breakdown. <br><b>Example:</b> Software, insurance, legal fees totaling $750 monthly.`}/>
                    )}
                  </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Profitability Goals</CardTitle>
                <CardDescription>Set targets to see what's required to achieve them.</CardDescription>
              </CardHeader>
              <CardContent>
                  <InputField name="desiredProfitMargin" label="Desired Net Profit Margin (%)" control={control} errors={errors} icon={Goal} placeholder="e.g., 15" step="0.1" type="number" tooltip="Enter your target profitability as a percentage of revenue (after returns). For example, entering '20' means you aim for $20 net profit for every $100 of revenue remaining after accounting for returns. This helps calculate the sales volume, price, or cost reductions needed to hit your goal. Leave blank for just break-even analysis." />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter your target profit margin (e.g., 15 for 15%). Leave blank if you only want break-even analysis.
                  Calculations assume this margin is applied to Revenue After Returns. Tax implications are considered if taxes are enabled.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Optional Financial Factors</CardTitle>
                <CardDescription>Include additional details for a more comprehensive analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <ToggleField
                    control={control}
                    name="includeInvestment"
                    label="Include Initial Investment & ROI?"
                    tooltip="Enable this if you want to calculate the Return on Investment (ROI). ROI measures how much profit your business generates relative to the initial capital invested. It helps assess the efficiency of your investment.<br><b>How it's used:</b> Net Profit / Initial Investment = ROI."
                    onValueChange={(checked) => {
                        setDependentFieldDefault(checked, 'initialInvestment', 0, setValue, getValues, trigger, ['initialInvestment']);
                        trigger('includeInvestment');
                    }}
                  />
                    {includeInvestmentWatch && ( <InputField name="initialInvestment" label="Initial Investment Amount" control={control} errors={errors} icon={Landmark} placeholder="e.g., 25000" tooltip="Enter the total one-time startup capital needed to launch the business. This is *not* a recurring expense. Includes costs like equipment purchases, initial inventory stock, lease deposits, website development, etc. <br><b>Example:</b> $15,000 equipment + $5,000 inventory + $5,000 setup = $25,000." /> )}
                <Separator />
                <ToggleField
                    control={control}
                    name="includeTaxes"
                    label="Include Income Tax?"
                    tooltip="Enable this to factor in estimated income taxes. Taxes are calculated on the Profit Before Tax (PBT) if it's positive. This provides a more realistic Net Profit figure. <br><b>How it's used:</b> Taxes Paid = Profit Before Tax * (Tax Rate / 100). Net Profit = Profit Before Tax - Taxes Paid."
                    onValueChange={(checked) => {
                        setDependentFieldDefault(checked, 'taxRate', 0, setValue, getValues, trigger, ['taxRate']);
                        trigger('includeTaxes');
                    }}
                />
                    {includeTaxesWatch && ( <InputField name="taxRate" label="Income Tax Rate (%)" control={control} errors={errors} icon={BadgePercent} placeholder="e.g., 21" step="0.1" tooltip="Enter your estimated *effective* income tax rate as a percentage. This rate considers federal, state, and local taxes applicable to your business profits. It can vary significantly. <br><b>Example:</b> If your combined effective tax rate is 25%, enter 25." /> )}
                <Separator />
                  <ToggleField
                    control={control}
                    name="includeLoan"
                    label="Include Loan Payments?"
                    tooltip="Enable if your business makes regular payments (principal + interest) on loans. These payments are treated as fixed operating costs in this profitability analysis. <br><b>How it's used:</b> Added to Total Fixed Costs."
                    onValueChange={(checked) => {
                        setDependentFieldDefault(checked, 'loanPayment', 0, setValue, getValues, trigger, ['loanPayment']);
                        trigger('includeLoan');
                    }}
                    />
                    {includeLoanWatch && ( <InputField name="loanPayment" label={`Loan Payment (per ${periodLabel})`} control={control} errors={errors} icon={CreditCard} placeholder="e.g., 500" tooltip={`Enter the total fixed amount paid towards all business loans during the selected period (${periodLabel}). Include both principal and interest components. <br><b>Example:</b> A monthly loan payment of $500.`} /> )}
                <Separator />
                  <ToggleField
                    control={control}
                    name="includeDepreciation"
                    label="Include Depreciation/Amortization?"
                    tooltip="Enable to include non-cash expenses representing the decrease in value of assets over time (Depreciation for physical assets like machinery, Amortization for intangible assets like software licenses). This reduces taxable income but doesn't affect cash flow directly for break-even unit calculation. <br><b>How it's used:</b> Added to Total Fixed Costs when calculating Profit Before Tax. Also impacts break-even calculations."
                     onValueChange={(checked) => {
                        setDependentFieldDefault(checked, 'depreciationAmortization', 0, setValue, getValues, trigger, ['depreciationAmortization']);
                        trigger('includeDepreciation');
                    }}
                    />
                    {includeDepreciationWatch && ( <InputField name="depreciationAmortization" label={`Depreciation & Amortization (per ${periodLabel})`} control={control} errors={errors} icon={MinusSquare} placeholder="e.g., 300" tooltip={`Enter the total depreciation and amortization expense allocated for the selected period (${periodLabel}). <br><b>Example:</b> A $6,000 laptop depreciated over 5 years (straight-line) has an annual depreciation of $1,200, or $100 monthly.`} /> )}
                <Separator />
                    <ToggleField
                        control={control}
                        name="includePaymentProcessingFees"
                        label="Include Payment Processing Fees?"
                        tooltip="Enable if you incur fees from services like Stripe, PayPal, Square, etc., for processing customer payments. These are usually a percentage of the transaction value, impacting your net revenue per sale. <br><b>How it's used:</b> Fee Amount = Revenue After Returns * (Fee Rate / 100). Added to Total Variable Costs."
                        onValueChange={(checked) => {
                           setDependentFieldDefault(checked, 'paymentProcessingFeeRate', 0, setValue, getValues, trigger, ['paymentProcessingFeeRate']);
                           trigger('includePaymentProcessingFees');
                        }}
                    />
                    {includePaymentProcessingFeesWatch && ( <InputField name="paymentProcessingFeeRate" label="Payment Processing Fee Rate (% of Adjusted Revenue)" control={control} errors={errors} icon={Receipt} placeholder="e.g., 2.9" step="0.1" tooltip="Enter the average percentage fee charged by payment processors, calculated on revenue *after* returns/refunds. <br><b>Example:</b> If a common rate is 2.9% + $0.30, estimate the overall percentage (e.g., for a $50 item, it might be closer to 3.5%). Enter 3.5." /> )}
                <Separator />
                    <ToggleField
                        control={control}
                        name="includeReturnsRefunds"
                        label="Include Returns & Refunds?"
                        tooltip="Enable to account for revenue lost due to customers returning products or requesting refunds. This directly reduces your effective revenue. <br><b>How it's used:</b> Revenue After Returns = Gross Revenue * (1 - Returns Rate / 100)."
                        onValueChange={(checked) => {
                            setDependentFieldDefault(checked, 'returnsRefundsRate', 0, setValue, getValues, trigger, ['returnsRefundsRate']);
                            trigger('includeReturnsRefunds');
                        }}
                    />
                    {includeReturnsRefundsWatch && ( <InputField name="returnsRefundsRate" label="Returns & Refunds Rate (% of Gross Revenue)" control={control} errors={errors} icon={Undo2}  placeholder="e.g., 4" step="0.1" tooltip="Estimate the percentage of your *total initial sales* (Gross Revenue) that is typically lost due to returns or refunds. <br><b>Example:</b> If you sell $10,000 worth of goods and issue $400 in refunds, the rate is 4%." /> )}
                <Separator />
                    <ToggleField
                        control={control}
                        name="includeOwnerDraw"
                        label="Include Owner Draw (as Fixed Cost)?"
                        tooltip="Enable to factor in regular withdrawals of profit by the owner(s) as a fixed cost. This helps determine profitability *after* the owner takes their compensation, useful for understanding the business's sustainability beyond just covering operational costs. <br><b>How it's used:</b> Added to Total Fixed Costs."
                        onValueChange={(checked) => {
                            setDependentFieldDefault(checked, 'ownerDraw', 0, setValue, getValues, trigger, ['ownerDraw']);
                            trigger('includeOwnerDraw');
                        }}
                    />
                    {includeOwnerDrawWatch && ( <InputField name="ownerDraw" label={`Owner Draw (per ${periodLabel})`} control={control} errors={errors} icon={Wallet} placeholder="e.g., 2000" tooltip={`Enter the fixed amount the owner(s) intend to withdraw from the business each period (${periodLabel}). This is treated as an operating expense for this analysis. <br><b>Example:</b> $2,000 per month.`} /> )}
              </CardContent>
            </Card>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <ResultsDisplay results={results} timePeriod={timePeriodWatch} currency={displayCurrency} />
          <TargetAnalysisDisplay
              targets={targets}
              timePeriod={timePeriodWatch}
              currency={displayCurrency}
              desiredProfitMargin={getValues('desiredProfitMargin')}
          />
        </div>

         <div className="flex flex-wrap justify-end gap-2 mt-8 mb-4">
            <Button className='blue' type="button" variant="outline" onClick={handleSaveScenario}><FileDown className="mr-2 h-4 w-4" /> Save Scenario</Button>
            <Button className='blue' type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" /> Load Scenario</Button>
            <input type="file" ref={fileInputRef} onChange={handleLoadScenario} accept=".json" style={{ display: 'none' }} />
            <Button className='blue' type="button" variant="outline" onClick={() => formatAndDownloadCSV(getValues(), results, targets)}><FileTextIcon className="mr-2 h-4 w-4" /> Download CSV</Button>
            <Button className='blue' type="button" variant="outline" onClick={handleDownloadPDFClick}><FileTextIcon className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      </div>
    </Form>
  );
}

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}


    
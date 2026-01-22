
import { differenceInBusinessDays, addDays } from 'date-fns';

/**
 * Calculates the number of working days (Mon-Fri) between two dates.
 * Includes both start and end date if they are working days.
 */
export const getWorkingDays = (startDate: Date, endDate: Date): number => {
    if (startDate > endDate) return 0;

    // differenceInBusinessDays returns the number of business days to be added to startDate to reach endDate.
    // It doesn't include the start date in the count if we think of it as "days passed", 
    // but usually for project duration we want inclusive count.
    // However, let's stick to standard business days.
    // differenceInBusinessDays(Fri, Mon) = 1.
    // If we want inclusive, we usually add 1 if start isn't weekend?

    // Let's use a simpler approach or trust date-fns.
    // differenceInBusinessDays excludes the end date.

    const days = differenceInBusinessDays(addDays(endDate, 1), startDate);
    return Math.max(0, days);
};

// Format a graduation year for display
export const formatGradYear = (year) => `Class of ${year}`;

// Capitalize first letter of each word
export const toTitleCase = (str) =>
    str.replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );

// Truncate long bios for card previews
export const truncate = (str, maxLength = 120) =>
    str?.length > maxLength ? str.slice(0, maxLength) + '…' : str;
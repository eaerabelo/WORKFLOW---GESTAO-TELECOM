export const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    return parts[0] || '';
};

export const getFirstAndLastName = (fullName) => {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || '';
    return `${parts[0]} ${parts[parts.length - 1]}`;
};

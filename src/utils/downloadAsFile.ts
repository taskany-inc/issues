export const downloadAsFile = (data: string, filename: string, type: string) => {
    const a = document.createElement('a');
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
};

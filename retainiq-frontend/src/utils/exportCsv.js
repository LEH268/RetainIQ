export function downloadCSV(data, filename) {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  // Get headers
  const headers = Object.keys(data[0]).join(",");
  
  // Convert objects to comma-separated strings
  const csvRows = data.map(row => {
    return Object.values(row).map(value => {
      // Escape quotes and wrap in quotes if there's a comma
      const stringValue = String(value);
      if (stringValue.includes(",")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",");
  });

  const csvString = [headers, ...csvRows].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
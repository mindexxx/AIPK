import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const generatePDFFromDOM = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element not found for PDF generation");
        return;
    }

    try {
        // Use html2canvas to capture the exact visual representation
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Allow loading cross-origin images
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 Dimensions
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate the ratio to fit width
        const ratio = Math.min(pdfWidth / imgWidth * 1.0, 1.0); // Don't scale up, only down
        
        const finalImgWidth = pdfWidth; // Full width
        const finalImgHeight = (imgHeight * pdfWidth) / imgWidth;

        // If height is greater than one page, we might need multi-page logic, 
        // but for now we scale to fit width and let it overflow to new pages if needed (basic implementation)
        // or just add the image. For robust multi-page from canvas, we slice.
        
        let heightLeft = finalImgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, finalImgWidth, finalImgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - finalImgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, finalImgWidth, finalImgHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`${filename}.pdf`);

    } catch (err) {
        console.error("PDF Generation failed:", err);
        alert("Failed to generate PDF. Please try again.");
    }
};
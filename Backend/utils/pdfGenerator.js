import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generates a certificate of appreciation in memory as a PDF Uint8Array.
 * @param {string} volunteerName 
 * @param {string} campaignName 
 * @param {number} hours 
 * @param {string} dateString 
 * @returns {Promise<Uint8Array>}
 */
export const generateCertificatePDF = async (volunteerName, campaignName, hours, dateString) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 420]);
    const { width, height } = page.getSize();

    // Draw dark blue outer border
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0, 0.29, 0.78), // #004ac6 (Stitch Primary)
        borderWidth: 4,
        color: rgb(0.97, 0.98, 1.0), // #f8f9ff (Stitch BG)
    });

    // Draw gold inner border
    page.drawRectangle({
        x: 28,
        y: 28,
        width: width - 56,
        height: height - 56,
        borderColor: rgb(0.93, 0.62, 0.04), // #f59e0b (Stitch Tertiary / Gold)
        borderWidth: 1.5,
    });

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Title
    page.drawText("CERTIFICATE OF APPRECIATION", {
        x: 110,
        y: 330,
        size: 24,
        font: fontBold,
        color: rgb(0, 0.29, 0.78),
    });

    // Subtitle
    page.drawText("This certificate is proudly presented to", {
        x: 180,
        y: 275,
        size: 12,
        font: font,
        color: rgb(0.26, 0.27, 0.33),
    });

    // Volunteer Name (Centered-ish)
    const nameText = volunteerName.toUpperCase();
    const nameWidth = fontBold.widthOfTextAtSize(nameText, 22);
    page.drawText(nameText, {
        x: (width - nameWidth) / 2,
        y: 220,
        size: 22,
        font: fontBold,
        color: rgb(0.04, 0.11, 0.19),
    });

    // Dividing Line
    page.drawLine({
        start: { x: 150, y: 205 },
        end: { x: 450, y: 205 },
        color: rgb(0.76, 0.78, 0.84),
        thickness: 1,
    });

    // Recognition Description
    const text1 = "in recognition of outstanding contributions as a community volunteer in the campaign";
    const text1Width = font.widthOfTextAtSize(text1, 10);
    page.drawText(text1, {
        x: (width - text1Width) / 2,
        y: 175,
        size: 10,
        font: font,
        color: rgb(0.26, 0.27, 0.33),
    });

    // Campaign Name
    const campaignText = `"${campaignName}"`;
    const campaignWidth = fontBold.widthOfTextAtSize(campaignText, 14);
    page.drawText(campaignText, {
        x: (width - campaignWidth) / 2,
        y: 145,
        size: 14,
        font: fontBold,
        color: rgb(0.0, 0.42, 0.29), // #006c49 (Stitch Green)
    });

    // Hours
    const hoursText = `for completing ${hours} hours of dedicated service and community impact.`;
    const hoursWidth = font.widthOfTextAtSize(hoursText, 11);
    page.drawText(hoursText, {
        x: (width - hoursWidth) / 2,
        y: 115,
        size: 11,
        font: font,
        color: rgb(0.26, 0.27, 0.33),
    });

    // Signatures
    // Date
    page.drawText(`Date: ${dateString}`, {
        x: 60,
        y: 65,
        size: 10,
        font: font,
        color: rgb(0.26, 0.27, 0.33),
    });
    page.drawLine({
        start: { x: 60, y: 80 },
        end: { x: 180, y: 80 },
        color: rgb(0.76, 0.78, 0.84),
        thickness: 1,
    });

    // Organizer Signature
    page.drawText("Authorized Representative", {
        x: 400,
        y: 65,
        size: 10,
        font: font,
        color: rgb(0.26, 0.27, 0.33),
    });
    page.drawLine({
        start: { x: 400, y: 80 },
        end: { x: 520, y: 80 },
        color: rgb(0.76, 0.78, 0.84),
        thickness: 1,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};

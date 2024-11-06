const adminModel = require("../../models/adminModel")
const userSchema = require('../../models/userModel')
const categorySchema = require('../../models/category')
const productSchema = require('../../models/productModel')
const orderSchema = require('../../models/orderModel')
const offerSchama = require('../../models/offerModel')
const PDFDocument = require('pdfkit');
const path = require('path'); 
const ExcelJS = require('exceljs');






// to render sales report page
const salesReport = async (req,res)=>{
    res.render('admin/salesReport')
}




// to generate sales report 
const generate = async (req, res) => {
    const { startDate, endDate, frequency } = req.body;
    
    const filter = {orderStatus:'Delivered'};

    if (frequency === 'custom' && startDate && endDate) {
        filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
        const now = new Date();
        if (frequency === 'daily') {
            filter.orderDate = { $gte: new Date(now.setHours(0, 0, 0, 0)), $lte: new Date(now.setHours(23, 59, 59, 999)) };
        } else if (frequency === 'weekly') {
            const now = new Date();
            
            // Get the first day of the current week (Sunday)
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setDate(now.getDate() - now.getDay()); 
            firstDayOfWeek.setHours(0, 0, 0, 0); 
        
            // Get the last day of the current week (Saturday)
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            lastDayOfWeek.setHours(23, 59, 59, 999); 
        
            // Filter to get orders within this week
            filter.orderDate = { 
                $gte: firstDayOfWeek, 
                $lte: lastDayOfWeek 
            };
        } else if (frequency === 'monthly') {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
            filter.orderDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
        } else if (frequency === 'yearly') {
            const firstDayOfYear = new Date(now.getFullYear(), 0, 1); 
            const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); 
            filter.orderDate = { $gte: firstDayOfYear, $lte: lastDayOfYear };
        }
    }

    
    try {
        const orders = await orderSchema.find(filter).populate('items.productID'); 

        let totalAmount = 0;
        let totalDiscount = 0;

        orders.forEach(order => {
            totalAmount += order.totalAmount; 

            order.items.forEach(item => {
                const originalPrice = item.productID.price; 
                const quantity = item.quantity;

                const discountAmount = (originalPrice * quantity) - item.price; 

                totalDiscount += discountAmount;
            });
        });

        const totalSales = orders.length;

        res.json({
            orders,
            totalSales,
            totalAmount,
            totalDiscount
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};






// to download as pdf


const pdf = async (req, res) => {
    try {
        const { startDate, endDate, frequency } = req.query;

        const filter = {orderStatus:'Delivered'};
        if (frequency === 'custom' && startDate && endDate) {
            filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            const now = new Date();
            if (frequency === 'daily') {
                filter.orderDate = {
                    $gte: new Date(now.setHours(0, 0, 0, 0)),
                    $lte: new Date(now.setHours(23, 59, 59, 999)),
                };
            }  else if (frequency === 'weekly') {
                const now = new Date();
                
                // Get the first day of the current week (Sunday)
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - now.getDay()); 
                firstDayOfWeek.setHours(0, 0, 0, 0); 
            
                // Get the last day of the current week (Saturday)
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                lastDayOfWeek.setHours(23, 59, 59, 999); 
            
                // Filter to get orders within this week
                filter.orderDate = { 
                    $gte: firstDayOfWeek, 
                    $lte: lastDayOfWeek 
                };
            } else if (frequency === 'monthly') {
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                filter.orderDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
            }  else if (frequency === 'yearly') {
                const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); 
                filter.orderDate = { $gte: firstDayOfYear, $lte: lastDayOfYear };
            }
        }

        const orders = await orderSchema.find(filter).populate('items.productID');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = 'sales-report.pdf';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        const rowLimit = 18; 
        const rowHeight = 30; 
        let x = 50, y = 180; 
        let rowCount = 0; 

        doc.fontSize(25).text('Sales Report', { align: 'center' });
        doc.moveDown();
        const reportDate = `Generated on: ${new Date().toLocaleDateString('en-IN')}`;
        doc.fontSize(12).text(reportDate, { align: 'center' }).moveDown(2);

        const headers = ['Order ID', 'Total Amount', 'Coupon Discount', 'Offer Discount', 'Biller Name', 'Date'];
        const widths = [120, 70, 60, 60, 130, 80]; 

        headers.forEach((header, index) => {
            doc.rect(x, y, widths[index], rowHeight).stroke();
            doc.fontSize(10).text(header, x + 5, y + 10, { width: widths[index], align: 'center' });
            x += widths[index];
        });

        x = 50;
        y += rowHeight;

        orders.forEach((order) => {
            if (rowCount >= rowLimit) {
                doc.addPage(); 
                y = 50; 
                rowCount = 0; 
            }


            const date = new Date(order.createdAt);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`; 

            const row = [
                order._id.toString(),
                `${order.totalAmount}`, 
                `${(order.couponDiscount || 0)}`, 
                `${(order.offerDiscount || 0)}`, 
                order.shippingAddress?.fullname || 'N/A',
                formattedDate, 
            ];


            row.forEach((cell, index) => {
                doc.rect(x, y, widths[index], rowHeight).stroke();
                doc.fontSize(8).text(cell, x + 5, y + 10, { width: widths[index], align: 'center' });
                x += widths[index];
            });

            x = 50;
            y += rowHeight;
            rowCount++; 
        });

        doc.end(); 
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
};





// to download as excel

const excelReport = async (req, res) => {
    try {
        const { startDate, endDate, frequency } = req.query;

        const filter = {orderStatus:'Delivered'};
        if (frequency === 'custom' && startDate && endDate) {
            filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            const now = new Date();
            if (frequency === 'daily') {
                filter.orderDate = {
                    $gte: new Date(now.setHours(0, 0, 0, 0)),
                    $lte: new Date(now.setHours(23, 59, 59, 999)),
                };
            }  else if (frequency === 'weekly') {
                const now = new Date();
                
                // Get the first day of the current week (Sunday)
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - now.getDay()); 
                firstDayOfWeek.setHours(0, 0, 0, 0); // Reset time to midnight
            
                // Get the last day of the current week (Saturday)
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                lastDayOfWeek.setHours(23, 59, 59, 999); // Set time to end of the day
            
                // Filter to get orders within this week
                filter.orderDate = { 
                    $gte: firstDayOfWeek, 
                    $lte: lastDayOfWeek 
                };
            } else if (frequency === 'monthly') {
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                filter.orderDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
            } else if (frequency === 'yearly') {
                const firstDayOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
                const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // December 31st
                filter.orderDate = { $gte: firstDayOfYear, $lte: lastDayOfYear };
            }
        }

        const orders = await orderSchema.find(filter).populate('items.productID');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order ID', width: 25 },
            { header: 'Total Amount', width: 15 },
            { header: 'Coupon Discount', width: 15 },
            { header: 'Offer Discount', width: 15 },
            { header: 'Biller Name', width: 30 },
            { header: 'Date', width: 15 },
        ];

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

            worksheet.addRow([
                order._id.toString(),
                order.totalAmount,
                (order.couponDiscount || 0),
                (order.offerDiscount || 0),
                order.shippingAddress?.fullname || 'N/A',
                formattedDate,
            ]);
        });

        const filename = 'sales-report.xlsx';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).send('An error occurred while generating the Excel report.');
    }
};








module.exports = {
    salesReport,
    generate,
    pdf,
    excelReport
}
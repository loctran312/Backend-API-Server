const db = require("../config/database");

exports.getCities = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM thanhpho ORDER BY ten_thanhpho ASC'
        );
        res.status(200).json({
            status: 'success',
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.getWards = async (req, res) => {
    const { cityId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT * FROM phuong WHERE ma_thanhpho = ? ORDER BY ten_phuong ASC', 
            [cityId]
        );
        res.status(200).json({
            status: 'success',
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}
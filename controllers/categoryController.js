const pool=require('../config/database');

// ktra quyen addmin
function isAdmin(req){
    return req.user && req.user.role === 'admin';
}

// chuyen doi du lieu tu db
function mapCatalogyRow(row)
{
    return {
        id: row.id,
        name: row.name,
        description: row.description || ''
    };
}

// get du lieu danh muc tu db
async function listCategories(req,res) {
    try {
        // select danh muc
        const [rows] = await pool.execute(
            `SELECT ma_danh_muc AS id ,
             ten_danh_muc AS name ,
            mo_ta AS description 
            FROM danh_muc
            ORDER BY ma_danh_muc DESC`
        );
        // tra ve kq json
        return res.json({
            status: 'success',
            catalogy: row.map(mapCatalogyRow)
        });
    } catch (error) {
        console.error('listCategories error:',error);
        return res.status(500).json({
            status: ' error',
            message: ' khong the tai danh muc '
        })
    }
}

// get id danh muc
async function getCategoriesById(req,res) {
    try {
        // lay id tu request url client
        const {id} = req.params;
        const [rows] = await pool.execute(
            `SELECT ma_danh_muc AS id ,
            ten_danh_muc AS name ,
            mo_ta AS description 
            FROM danh_muc
            Where ma_danh_muc = ?`,[id]
        );
        if(!rows.length)
        {
            return res.status(404).json({
            status: ' error',
            message: ' khong tim thay danh muc '
            }) ;
        }
        // tra kq json 
        return res.json({
            status: 'success',
            catalogy: mapCatalogyRow(rows[0])
        });
    } catch (error) {
        console.error(' getCategoriesById error:',error);
        return res.status(500).json({
            status: ' error',
            message: ' khong the tai danh muc '
        })
    }
}

// insert danh muc moi
async function createCategories(req,res) {
    try {
        if(!isAdmin(req))
        {
            return res.status(403).json({
                status: 'error',
                message: 'forbidden'
            });
        }
        // lay du tu body html
        const {name,description} = req.body;
        // bat dau insert
        const [result] = await pool.execute(
            `INSERT INTO danh_muc (ten_danh_muc,mo_ta)
            VALUES(?,?) `,[name.trim(),description || '']
        );
        // tra id danh muc vua them
        return res.status(201).json({
            status: 'success',
            id: result.insertId ,
            message: 'tao danh muc tc'
        })
    } catch (error) {
        console.error(' createCategories error:',error);
        return res.status(500).json({
            status: ' error',
            message: ' khong the them danh muc '
        })
    }   
}

// sua danh muc
async function updateCategories(req,res) {
    try {
        if(!isAdmin(req))
        {
            return res.status(403).json({
                status: 'error',
                message: 'forbidden'
            });
        }
        // lay id tu url
        const {id} = req.params;
        const {name,description} = req.body;
        // ktra id ton tai hay hong
        const [rows] = await pool.execute(
            ` SELECT ma_danh_muc AS id 
            FROM danh_muc
            WHERE ma_danh_muc= ? `,[id]
        );
        if(!rows.length)
        {
            return res.status(404).json({
            status: ' error',
            message: ' khong tim thay danh muc '
            }) ;
        }
        // ktra du lieu dau vao
        if(name !== undefined && name.trim())
        {
            return res.status(400).json({
            status: ' error',
            message: ' ten khong dc de trong '
            }) ;
        }
        // cap nhat theo id
        await pool.execute(
            `UPDATE danh_muc SET ten_danh_muc = ? ,mo_ta = ? `[name,description]
        )        
        return res.json({
            status: 'success',
            id: result.insertId ,
            message: 'cap nhat danh muc tc'
        })
    } catch (error) {
        console.error(' updateCategories error:',error);
        return res.status(500).json({
            status: ' error',
            message: ' khong the cap nhat danh muc '
        })
    }   
}

//xoa danh muc
async function deleteCategories(req,res) {
    try {
        if(!isAdmin(req))
        {
            return res.status(403).json({
                status: 'error',
                message: 'forbidden'
            });
        }
        const {id} = req.params;
        // ktra id danh muc ton tai hay hong
        const [rows] = await pool.execute(
            ` SELECT ma_danh_muc AS id 
            FROM danh_muc
            WHERE ma_danh_muc= ? `,[id]
        );
        if(!rows.length)
        {
            return res.status(404).json({
            status: ' error',
            message: ' khong tim thay danh muc '
            }) ;
        }
        // ktra co sp nao dang dung danh muc ko
        const [products] = await pool.execute(
            `SELECT * 
            FROM san_pham 
            WHERE ma_danh_muc = ?  `,[id]
        );
        if(products.length)
        {
            return res.status(400).json({
            status: ' error',
            message: ' danh co sp su dung danh muc khong duoc xoa vui long xoa cac sp dang su dung danh muc truoc '
            }) ;
        }
        //neu thuc pass het thi xoa
        await pool.execute(
            `DELETE FROM danh_muc 
            WHERE ma_danh_muc = ?`[id]
        );
        //
        return res.json({
            status: 'success',
            id: result.insertId ,
            message: 'xoa danh muc tc'
        })
    } catch (error) {
        console.error(' createCategories error:',error);
        return res.status(500).json({
            status: ' error',
            message: ' khong the them danh muc '
        })
    }   
}
module.exports = {
    listCategories,
    getCategoriesById,
	createCategories,
	updateCategories,
	deleteCategories
};
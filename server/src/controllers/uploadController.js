const User     = require('../models/User');
const supabase = require('../config/storage');

// POST /api/upload/photo
exports.uploadPhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Delete old photo from Supabase if it exists
        if (user.photoUrl) {
            const oldPath = user.photoUrl.split('/avatars/')[1];
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
            }
        }

        // Upload new photo to Supabase Storage
        const fileExt  = req.file.originalname.split('.').pop();
        const fileName = `user-${req.user.id}-${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert:      true,
            });

        if (error) throw error;

        // Get the public URL
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        const photoUrl = data.publicUrl;

        await user.update({ photoUrl });

        res.json({ photoUrl });
    } catch (err) {
        next(err);
    }
};
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { updateUserProfile } from '../../services/api';
import { getCroppedImg } from '../../lib/imageUtils';

export default function ProfileModal({ user, setUser, onClose, showToast }) {
    const [newAvatar, setNewAvatar] = useState(user.avatar || '');
    const [newBio, setNewBio] = useState(user.bio || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Image Cropping States
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setTempImageUrl(url);
            setIsCropping(true);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirmCrop = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(tempImageUrl, croppedAreaPixels);
            const croppedFile = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
            setAvatarFile(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedImageBlob));
            setIsCropping(false);
        } catch (e) {
            console.error(e);
            showToast('Erro ao processar imagem', 'error');
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            let hasChanges = false;

            if (avatarFile) {
                formData.append('avatarFile', avatarFile);
                hasChanges = true;
            } else if (newAvatar !== user.avatar) {
                formData.append('avatar', newAvatar);
                hasChanges = true;
            }

            if (newBio !== user.bio) {
                formData.append('bio', newBio);
                hasChanges = true;
            }

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    return showToast('As senhas não coincidem', 'error');
                }
                if (newPassword.length < 6) {
                    return showToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
                }
                if (!currentPassword) {
                    return showToast('Digite sua senha atual para autorizar a mudança', 'error');
                }
                formData.append('password', newPassword);
                formData.append('currentPassword', currentPassword);
                hasChanges = true;
            }

            if (!hasChanges) {
                return showToast('Nenhuma alteração feita', 'error');
            }

            const res = await updateUserProfile(user.id, formData);
            const updatedUser = { ...user, ...res.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Limpa campos de senha
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setAvatarFile(null);

            onClose();
            showToast('Perfil atualizado!', 'success');
        } catch (err) {
            showToast(err.message || 'Erro ao atualizar perfil', 'error');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div
                className="glass"
                style={{
                    borderRadius: 24, padding: 32,
                    maxWidth: 440, width: '100%',
                    maxHeight: '90vh', overflowY: 'auto',
                    color: 'var(--text-color)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>✏️ Editar Perfil</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 20 }}>✕</button>
                </div>

                {isCropping ? (
                    <div style={{ position: 'relative', width: '100%', height: 350, background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                        <Cropper
                            image={tempImageUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setIsCropping(false)}
                                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 10, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmCrop}
                                    style={{ flex: 1, padding: '10px', background: 'var(--accent-color)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Confirmar Corte
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Suas Conquistas</p>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {user.achievements?.map(ach => (
                                    <Badge
                                        key={ach.type}
                                        icon={ach.icon}
                                        label={ach.label}
                                        color={ach.color}
                                        onClick={() => window.openAchievementList(ach)}
                                    />
                                ))}
                            </div>
                        </div>

                        <form onSubmit={updateProfile}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)', marginBottom: 12 }}>
                                    <img src={previewUrl || 'https://via.placeholder.com/80'} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <label style={{
                                    padding: '8px 16px',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'var(--accent-color)',
                                    transition: 'all 0.2s ease'
                                }}>
                                    📸 Trocar Foto
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                            </div>

                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Avatar (URL ou ID)</label>
                            <input
                                type="text" placeholder="https://..."
                                value={newAvatar} onChange={e => {
                                    setNewAvatar(e.target.value);
                                    if (!avatarFile) setPreviewUrl(e.target.value);
                                }}
                                style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                            />

                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sobre você</label>
                            <textarea
                                placeholder="Conte um pouco sobre você..."
                                value={newBio} onChange={e => setNewBio(e.target.value)}
                                rows="3"
                                style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', resize: 'vertical', fontSize: 16, outline: 'none' }}
                            />

                            <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0 16px' }} />
                            <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>📱 Notificações</p>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (window.subscribeToPush) await window.subscribeToPush();
                                    else showToast('Funcionalidade sendo preparada...', 'info');
                                }}
                                style={{
                                    width: '100%', padding: '12px', background: 'var(--input-bg)',
                                    color: 'var(--text-color)', border: '1px solid var(--border-color)',
                                    borderRadius: 12, cursor: 'pointer', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    marginBottom: 24
                                }}
                            >
                                🔔 Ativar Notificações Push
                            </button>

                            <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0 16px' }} />
                            <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🛡️ Segurança</p>

                            <input
                                type="password" placeholder="Senha Atual"
                                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                            />
                            <input
                                type="password" placeholder="Nova Senha"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                            />
                            <input
                                type="password" placeholder="Confirmar Nova Senha"
                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: 12, marginBottom: 24, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                            />

                            <button type="submit" style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(141, 106, 255, 0.3)' }}>
                                Atualizar Perfil
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

function Badge({ icon, label, color, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: `${color}15`,
                border: `1px solid ${color}30`,
                padding: '6px 12px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                color: color,
                cursor: onClick ? 'pointer' : 'default'
            }}
        >
            <span>{icon}</span> {label}
        </div>
    );
}

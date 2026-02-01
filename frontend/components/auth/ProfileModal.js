import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useRouter } from 'next/router';
import { updateUserProfile } from '../../services/api';
import { getCroppedImg } from '../../lib/imageUtils';
import { LogOut, Lock } from 'lucide-react';

export default function ProfileModal({ user, setUser, onClose, showToast, logout, allowSecret, onGoToSecret, onRequestSecret }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile'); // profile, security, achievements

    const [newAvatar, setNewAvatar] = useState(user.avatar || '');
    const [newBio, setNewBio] = useState(user.bio || '');
    const [newEmail, setNewEmail] = useState(user.email || '');
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

            if (newEmail !== user.email) {
                formData.append('email', newEmail);
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

            // Não fecha o modal, apenas notifica
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
                    borderRadius: 24, padding: 0,
                    maxWidth: 500, width: '100%',
                    maxHeight: '90vh', overflow: 'hidden',
                    color: 'var(--text-color)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.3s ease-out',
                    display: 'flex', flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>✏️ Editar Perfil</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 24px', marginTop: 24, borderBottom: '1px solid var(--border-color)' }}>
                    {['profile', 'security', 'achievements'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--accent-color)' : 'var(--secondary-text)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'profile' && '👤 Perfil'}
                            {tab === 'security' && '🛡️ Segurança'}
                            {tab === 'achievements' && '🏆 Conquistas'}
                        </button>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div style={{ padding: 24, overflowY: 'auto' }}>
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
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={updateProfile}>

                            {/* TAB: PROFILE */}
                            {activeTab === 'profile' && (
                                <div className="animate-fade-in">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                                        <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)', marginBottom: 12 }}>
                                            <img src={previewUrl || 'https://via.placeholder.com/100'} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                            transition: 'all 0.2s ease',
                                            marginBottom: 8
                                        }}>
                                            📸 Alterar Foto
                                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </label>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
                                        <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>@{user.username}</div>
                                    </div>

                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sobre você</label>
                                    <textarea
                                        placeholder="Conte um pouco sobre você..."
                                        value={newBio} onChange={e => setNewBio(e.target.value)}
                                        rows="3"
                                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', resize: 'vertical', fontSize: 16, outline: 'none' }}
                                    />

                                    {/* Hidden fallback for URL input if cropping fails or is unwanted, technically hidden but kept state */}
                                    {/* <input ... /> removed to clean UI, file upload is preferred */}

                                    <div style={{ padding: 16, background: 'var(--glass-bg)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Informações</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, alignItems: 'center' }}>
                                            <span style={{ color: 'var(--secondary-text)' }}>Email:</span>
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={e => setNewEmail(e.target.value)}
                                                placeholder="Adicionar e-mail..."
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: '1px solid var(--secondary-text)',
                                                    color: 'var(--text-color)',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    textAlign: 'right',
                                                    width: '60%',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--secondary-text)' }}>Membro desde:</span>
                                            <span style={{ fontWeight: 600 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <button type="submit" style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(141, 106, 255, 0.3)', marginBottom: 16 }}>
                                        Salvar Alterações
                                    </button>

                                    {/* Actions Group (Restricted + Logout) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <button
                                            type="button"
                                            onClick={onRequestSecret}
                                            style={{
                                                padding: '12px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                fontSize: 14,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            <Lock size={16} /> Restrito
                                        </button>

                                        <button
                                            type="button"
                                            onClick={logout}
                                            style={{
                                                padding: '12px',
                                                background: 'var(--input-bg)',
                                                color: 'var(--secondary-text)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: 14,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            <LogOut size={16} /> Sair
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: SECURITY */}
                            {activeTab === 'security' && (
                                <div className="animate-fade-in">
                                    <p style={{ fontSize: 14, color: 'var(--secondary-text)', marginBottom: 20 }}>
                                        Para alterar sua senha, precisamos que você confirme sua senha atual.
                                    </p>

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
                                        Atualizar Senha
                                    </button>

                                    {/* Secret Button if allowed */}
                                    {user.allowSecret && (
                                        <>
                                            <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0' }} />
                                            <button
                                                type="button"
                                                onClick={onGoToSecret}
                                                style={{
                                                    width: '100%', padding: '12px',
                                                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                                    color: '#fff', border: 'none', borderRadius: 12,
                                                    cursor: 'pointer', fontWeight: 800, fontSize: 14,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
                                                }}
                                            >
                                                🔒 Acessar Área Restrita (Shura Logs)
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB: ACHIEVEMENTS */}
                            {activeTab === 'achievements' && (
                                <div className="animate-fade-in">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                                        {user.achievements && user.achievements.length > 0 ? (
                                            user.achievements.map(ach => (
                                                <div key={ach.type}
                                                    onClick={() => window.openAchievementList && window.openAchievementList(ach)}
                                                    style={{
                                                        background: 'var(--glass-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: 16,
                                                        padding: 16,
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 24, marginBottom: 8, filter: `drop-shadow(0 0 10px ${ach.color})` }}>{ach.icon}</div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{ach.label}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--secondary-text)' }}>{ach.description || 'Conquista desbloqueada'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--secondary-text)' }}>
                                                <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
                                                <div>Ainda sem conquistas.</div>
                                                <div style={{ fontSize: 12 }}>Continue interagindo para desbloquear!</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

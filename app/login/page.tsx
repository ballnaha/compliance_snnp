"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Stack,
    InputAdornment,
    IconButton,
    CircularProgress,
    Fade,
} from "@mui/material";
import {
    User,
    Lock,
    Eye,
    EyeSlash,
    LoginCurve,
    ShieldTick,
    DocumentText
} from "iconsax-react";
import { useSnackbar } from "@/components/SnackbarProvider";

export default function LoginPage() {
    const { showSnackbar } = useSnackbar();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                showSnackbar("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง", "error");
                setLoading(false);
            } else {
                window.location.href = "/";
            }
        } catch (error) {
            showSnackbar("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", "error");
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            "&::before": {
                content: '""',
                position: "absolute",
                width: "140%",
                height: "140%",
                top: "-20%",
                left: "-20%",
                zIndex: 0,
                background: "radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.05) 0%, transparent 40%)",
            }
        }}>
            {/* Animated background blobs */}
            <Box sx={{
                position: "absolute",
                width: 400,
                height: 400,
                borderRadius: "50%",
                filter: "blur(80px)",
                background: "rgba(99, 102, 241, 0.1)",
                top: "10%",
                right: "10%",
                zIndex: 0,
            }} />
            <Box sx={{
                position: "absolute",
                width: 300,
                height: 300,
                borderRadius: "50%",
                filter: "blur(60px)",
                background: "rgba(236, 72, 153, 0.07)",
                bottom: "10%",
                left: "10%",
                zIndex: 0,
            }} />

            <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
                <Fade in={true} timeout={1000}>
                    <Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 4, sm: 6 },
                                borderRadius: 8,
                                border: '1px solid',
                                borderColor: 'rgba(255, 255, 255, 0.6)',
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(20px)',
                                textAlign: 'center',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                            }}
                        >
                            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 4,
                                    bgcolor: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2,
                                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                                    color: 'white'
                                }}>
                                    <ShieldTick variant="Bold" size={32} color="white" />
                                </Box>
                                <Typography variant="h4" fontWeight="900" sx={{
                                    mb: 1,
                                    letterSpacing: '-0.02em',
                                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    SNNP Compliance
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    ยินดีต้อนรับเข้าสู่ระบบจัดการเอกสาร
                                </Typography>
                            </Box>

                            <form onSubmit={handleSubmit}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="ชื่อผู้ใช้งาน"
                                        fullWidth
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                                        InputProps={{
                                            sx: { borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.5)' },
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <User size={20} color="#64748b" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <TextField
                                        label="รหัสผ่าน"
                                        type={showPassword ? "text" : "password"}
                                        fullWidth
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="กรอกรหัสผ่านของคุณ"
                                        InputProps={{
                                            sx: { borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.5)' },
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock size={20} color="#64748b" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <Box sx={{ py: 1 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            disabled={loading}
                                            sx={{
                                                borderRadius: 4,
                                                py: 1.8,
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                                                '&:hover': {
                                                    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
                                                    transform: 'translateY(-2px)',
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {loading ? (
                                                <CircularProgress size={24} sx={{ color: 'white' }} />
                                            ) : (
                                                <>
                                                    เข้าสู่ระบบ
                                                    <LoginCurve size={22} style={{ marginLeft: 8 }} />
                                                </>
                                            )}
                                        </Button>
                                    </Box>
                                </Stack>
                            </form>

                            <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    <DocumentText size={14} />
                                    © {new Date().getFullYear()} SNNP Compliance System. All Rights Reserved.
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
}

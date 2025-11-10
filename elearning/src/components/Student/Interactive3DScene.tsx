import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Card, CardContent, Typography, Button, Stack, useTheme, useMediaQuery } from '@mui/material';

const AnimatedObject = ({ position, color, scale, rotationSpeed, objectType }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      if (rotationSpeed) {
        meshRef.current.rotation.x += rotationSpeed * 0.01;
        meshRef.current.rotation.y += rotationSpeed * 0.015;
      }
    }
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.001;
    }
  });

  const renderObject = () => {
    switch (objectType) {
      case 'cube':
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
      case 'sphere':
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.3} />
          </mesh>
        );
      case 'pyramid':
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <coneGeometry args={[0.8, 1.5, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
          </mesh>
        );
      case 'star':
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <octahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe={false} />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <torusGeometry args={[0.5, 0.2, 16, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
    }
  };

  return (
    <group ref={groupRef}>
      {renderObject()}
    </group>
  );
};

const Scene = ({ sceneType }: { sceneType: string }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = 5;
    }
  }, []);

  const getSceneObjects = () => {
    switch (sceneType) {
      case 'numbers':
        return [
          { position: [-2, 0, 0], color: '#FF6B9D', scale: 1.5, rotationSpeed: 1, objectType: 'cube' },
          { position: [0, 0, 0], color: '#4ECDC4', scale: 1.2, rotationSpeed: 1.5, objectType: 'sphere' },
          { position: [2, 0, 0], color: '#FFE66D', scale: 1.3, rotationSpeed: 1.2, objectType: 'pyramid' },
        ];
      case 'shapes':
        return [
          { position: [-1.5, 1.5, 0], color: '#FF6B9D', scale: 1, rotationSpeed: 1.5, objectType: 'cube' },
          { position: [1.5, 1.5, 0], color: '#4ECDC4', scale: 1, rotationSpeed: 1.2, objectType: 'sphere' },
          { position: [-1.5, -1.5, 0], color: '#FFE66D', scale: 1, rotationSpeed: 1, objectType: 'pyramid' },
          { position: [1.5, -1.5, 0], color: '#95E1D3', scale: 1, rotationSpeed: 1.3, objectType: 'star' },
        ];
      case 'colors':
        return [
          { position: [-3, 0, 0], color: '#FF6B9D', scale: 1.8, rotationSpeed: 1, objectType: 'sphere' },
          { position: [0, 0, 0], color: '#FFE66D', scale: 1.8, rotationSpeed: 1.2, objectType: 'sphere' },
          { position: [3, 0, 0], color: '#4ECDC4', scale: 1.8, rotationSpeed: 0.8, objectType: 'sphere' },
        ];
      case 'letters':
        return [
          { position: [-2.5, 1, 0], color: '#FF6B9D', scale: 1.2, rotationSpeed: 1.5, objectType: 'cube' },
          { position: [0, 1, 0], color: '#4ECDC4', scale: 1.2, rotationSpeed: 1.2, objectType: 'cube' },
          { position: [2.5, 1, 0], color: '#FFE66D', scale: 1.2, rotationSpeed: 1, objectType: 'cube' },
          { position: [-1.25, -1.5, 0], color: '#95E1D3', scale: 1.2, rotationSpeed: 1.3, objectType: 'cube' },
          { position: [1.25, -1.5, 0], color: '#FF8E8E', scale: 1.2, rotationSpeed: 1.1, objectType: 'cube' },
        ];
      default:
        return [
          { position: [-2, 0, 0], color: '#FF6B9D', scale: 1.5, rotationSpeed: 1.2, objectType: 'star' },
          { position: [0, 0, 0], color: '#FFE66D', scale: 1.5, rotationSpeed: 1, objectType: 'sphere' },
          { position: [2, 0, 0], color: '#4ECDC4', scale: 1.5, rotationSpeed: 1.3, objectType: 'cube' },
        ];
    }
  };

  return (
    <>
      <PerspectiveCamera ref={cameraRef} position={[0, 0, 5]} fov={75} />
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        autoRotate={true}
        autoRotateSpeed={2}
      />
      
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 10]} intensity={0.4} color="#FF6B9D" />
      <pointLight position={[0, 0, -10]} intensity={0.3} color="#4ECDC4" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade={true} speed={0.5} />
      
      {getSceneObjects().map((obj, idx) => (
        <AnimatedObject key={idx} {...obj} />
      ))}
    </>
  );
};

interface Interactive3DSceneProps {
  initialScene?: string;
  onSceneChange?: (scene: string) => void;
}

const Interactive3DScene: React.FC<Interactive3DSceneProps> = ({ 
  initialScene = 'numbers',
  onSceneChange 
}) => {
  const [currentScene, setCurrentScene] = useState(initialScene);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scenes = [
    { id: 'numbers', label: '🔢 Numbers', description: 'Learn to count!' },
    { id: 'shapes', label: '🔷 Shapes', description: 'Explore shapes!' },
    { id: 'colors', label: '🌈 Colors', description: 'Discover colors!' },
    { id: 'letters', label: '📝 Letters', description: 'Learn letters!' },
  ];

  const handleSceneChange = (sceneId: string) => {
    setCurrentScene(sceneId);
    onSceneChange?.(sceneId);
  };

  return (
    <Card 
      sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', height: isMobile ? 300 : 400, width: '100%' }}>
          <Canvas>
            <Scene sceneType={currentScene} />
          </Canvas>
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)',
              backdropFilter: 'blur(5px)',
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ color: 'white', fontWeight: 'bold', mb: 2, textAlign: 'center' }}
            >
              🎨 Interactive Learning Scene
            </Typography>
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={1} 
              sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
            >
              {scenes.map((scene) => (
                <Button
                  key={scene.id}
                  onClick={() => handleSceneChange(scene.id)}
                  sx={{
                    background: currentScene === scene.id
                      ? 'linear-gradient(135deg, #FF6B9D 0%, #FFE66D 100%)'
                      : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    px: 2,
                    py: 1,
                    fontSize: '0.85rem',
                    border: currentScene === scene.id ? '2px solid white' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: currentScene === scene.id
                        ? 'linear-gradient(135deg, #FFE66D 0%, #FF6B9D 100%)'
                        : 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {scene.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Interactive3DScene;

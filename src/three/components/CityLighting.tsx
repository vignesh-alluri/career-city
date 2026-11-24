/** Blue-violet ambient light (Tokyo night), a cool key light, a magenta rim from behind and an orange fill from the highway side. */
export function CityLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color="#5663B8" />
      <hemisphereLight args={['#3A4AA8', '#0A0A1C', 0.6]} />
      <directionalLight position={[15, 25, 10]} intensity={1.0} color="#C4D2FF" />
      <directionalLight position={[-15, 10, -20]} intensity={0.7} color="#FF3D9A" />
      <directionalLight position={[-20, 6, 15]} intensity={0.3} color="#FF7A2F" />
    </>
  )
}

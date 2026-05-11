import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-hero">
      <div className="auth-logo">⚽</div>
      <h1 className="landing-title">
        Prode <span>Social</span>
      </h1>
      <p className="landing-subtitle">
        No es solo un prode. Es un grupo de amigos, una sala de chat, un ring de predicciones y un bot de IA que te desafía. Todo en uno.
      </p>
      <div className="landing-actions">
        <Link href="/signup" className="btn btn-primary btn-lg">Crear Cuenta</Link>
        <Link href="/login" className="btn btn-secondary btn-lg">Iniciar Sesión</Link>
      </div>
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <div className="feature-title">Chat en Tiempo Real</div>
          <div className="feature-desc">Cada torneo es una sala de chat grupal. Tus pronósticos, resultados y rankings viven dentro de la conversación.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <div className="feature-title">IA que Compite</div>
          <div className="feature-desc">ProdeBot analiza partidos, hace sus propios pronósticos y compite en la tabla. ¿Podés ganarle?</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔥</div>
          <div className="feature-title">Rachas e Insignias</div>
          <div className="feature-desc">Mantené tu racha diaria, desbloqueá insignias exclusivas y presumí en el grupo.</div>
        </div>
      </div>
    </div>
  );
}

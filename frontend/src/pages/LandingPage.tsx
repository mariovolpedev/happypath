import { Link } from 'react-router-dom'

const DEMO_POSTS = [
  {
    id: 1,
    author: 'Sole_Mattina',
    avatar: '☀️',
    mood: '😊',
    time: '2 ore fa',
    text: 'Oggi ho fatto una passeggiata nel parco e mi sono ricordata quanto sia bello stare all\'aperto. Piccole gioie quotidiane 🌿',
    reactions: { '💛': 24, '🌟': 12, '🤗': 8 },
    comments: 5,
  },
  {
    id: 2,
    author: 'Marco_Sereno',
    avatar: '🌈',
    mood: '🥰',
    time: '4 ore fa',
    text: 'Ho finalmente finito il libro che stavo leggendo da mesi! Sensazione fantastica mettere l\'ultima pagina e sentirsi soddisfatti.',
    reactions: { '📚': 31, '💛': 19, '✨': 14 },
    comments: 9,
  },
  {
    id: 3,
    author: 'GiuliaFlowers',
    avatar: '🌸',
    mood: '😌',
    time: '6 ore fa',
    text: 'Ricetta del giorno: pancakes al miele con frutta fresca. Semplicissimi e deliziosi. Ve la condivido volentieri 🍓',
    reactions: { '🍯': 42, '😋': 27, '💛': 16 },
    comments: 13,
    hasImage: true,
  },
  {
    id: 4,
    author: 'Lupo_Tranquillo',
    avatar: '🐺',
    mood: '🧘',
    time: 'ieri',
    text: 'Meditazione mattutina: 10 minuti di respiro consapevole hanno reso tutta la giornata più fluida. Provate anche voi!',
    reactions: { '🧘': 38, '💛': 21, '🌿': 11 },
    comments: 7,
  },
]

const FEATURES = [
  {
    icon: '🌻',
    title: 'Solo buonumore',
    desc: 'Contenuti moderati per garantire un\'atmosfera sempre positiva. Niente negatività, solo storie che fanno bene.',
  },
  {
    icon: '🎭',
    title: 'Alter Ego',
    desc: 'Crea fino a 3 personalità digitali e condividi storie diverse per ogni tuo lato. Un\'unicità tutta di HappyPath.',
  },
  {
    icon: '🎨',
    title: 'Temi personalizzati',
    desc: 'Personalizza l\'esperienza visiva con temi creati dalla community. Ogni tema racconta una storia.',
  },
  {
    icon: '💌',
    title: 'Messaggi dedicati',
    desc: 'Dedica post e messaggi a persone speciali. Un modo unico per far sentire gli altri apprezzati.',
  },
  {
    icon: '🔒',
    title: 'Privacy al primo posto',
    desc: 'Controlla chi vede i tuoi contenuti. La tua serenità digitale è la nostra priorità.',
  },
  {
    icon: '✨',
    title: 'Feed intelligente',
    desc: 'Scegli tu cosa vedere: i tuoi interessi, le persone che ami, i temi che ti ispirano.',
  },
]

function DemoPost({ post }: { post: typeof DEMO_POSTS[0] }) {
  return (
    <div className="card mb-4 relative overflow-hidden">
      {/* Blur overlay che invita alla registrazione */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center"
        style={{
          backdropFilter: post.id % 2 === 0 ? 'blur(6px)' : 'none',
          background: post.id % 2 === 0 ? 'rgba(var(--bg-base-rgb,255,251,245), 0.7)' : 'transparent',
          pointerEvents: post.id % 2 === 0 ? 'auto' : 'none',
        }}
      >
        {post.id % 2 === 0 && (
          <div className="text-center px-4">
            <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-base)' }}>Registrati per leggere tutto 🔓</p>
            <Link to="/register"
              className="btn-primary text-xs px-4 py-1.5"
              style={{ display: 'inline-flex' }}
            >
              Unisciti gratis
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <span className="text-2xl">{post.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>{post.author}</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{post.time}</span>
            <span className="ml-auto text-base">{post.mood}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{post.text}</p>
          {post.hasImage && (
            <div
              className="mt-3 rounded-xl h-28 flex items-center justify-center text-4xl"
              style={{ background: 'var(--surface-2)', filter: 'blur(2px)' }}
            >
              🍓
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                {emoji} {count}
              </span>
            ))}
            <span className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>💬 {post.comments}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <div className="inline-block text-5xl mb-4">🌻</div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-base)' }}>
          Benvenuto su HappyPath
        </h1>
        <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
          Il social network dove ogni storia porta gioia. Solo contenuti positivi, solo buon umore.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            🌱 Inizia il tuo percorso
          </Link>
          <Link to="/login" className="btn-secondary text-base px-6 py-3">
            Accedi
          </Link>
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>Gratuito · Senza pubblicità · Solo buon umore</p>
      </section>

      {/* Demo feed */}
      <section className="max-w-xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--text-base)' }}>👀 Un assaggio di HappyPath</h2>
          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--happy-50,#fef9ee)', color: 'var(--happy-700,#a16207)' }}>Demo</span>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
          Questi sono contenuti di esempio. Registrati per scoprire il feed reale!
        </p>
        {DEMO_POSTS.map(post => <DemoPost key={post.id} post={post} />)}
        {/* CTA finale */}
        <div className="text-center py-8 rounded-2xl" style={{ background: 'var(--surface-1)' }}>
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-base)' }}>Vuoi leggere di più?</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Registrati gratis e accedi a tutti i contenuti della community</p>
          <Link to="/register" className="btn-primary px-8 py-2.5">
            Registrati ora — è gratis!
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4" style={{ background: 'var(--surface-1)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: 'var(--text-base)' }}>
            Perché HappyPath è diverso
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--text-faint)' }}>Funzionalità pensate per il tuo benessere digitale</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card flex gap-4 items-start">
                <span className="text-3xl mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text-base)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-16 px-4">
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-base)' }}>Pronto a iniziare?</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Unisciti a migliaia di persone che hanno scelto un social più felice</p>
        <Link to="/register" className="btn-primary text-base px-10 py-3">
          🌻 Crea il tuo account gratis
        </Link>
      </section>
    </div>
  )
}

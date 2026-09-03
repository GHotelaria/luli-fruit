// Direcção visual: Picnic Pop — mesa de jogo assimétrica, etiquetas de papel e coral morango.
import { useEffect, useRef, useState } from "react";
import { FruitGame, GameSnapshot } from "@/game/gameEngine";
import { FRUITS, FruitDefinition, getFruit } from "@/game/fruits";
import { Volume2, VolumeX, Pause, Play, RotateCcw, HelpCircle, Settings2, ChevronLeft, Images } from "lucide-react";

const LOGO = "/assets/logo_luli_merge.png";
const STICKERS = [
  { id: 1, tier: "BRONZE", name: "I ♥ LULI", image: "/assets/sticker_01_i_luli.png" },
  { id: 2, tier: "BRONZE", name: "LULINDA", image: "/assets/sticker_02_lulinda.png" },
  { id: 3, tier: "BRONZE", name: "BEBITA", image: "/assets/sticker_03_bebita.png" },
  { id: 4, tier: "BRONZE", name: "OBRIGADO, LULI!", image: "/assets/sticker_04_obrigado_luli.png" },
  { id: 5, tier: "BRONZE", name: "A LULI CHEGOU!", image: "/assets/sticker_05_luli_chegou.png" },
  { id: 6, tier: "BRONZE", name: "LULI MÁGICA", image: "/assets/sticker_06_luli_magica.png" },
  { id: 7, tier: "BRONZE", name: "É A LULI!", image: "/assets/sticker_07_e_a_luli.png" },
  { id: 8, tier: "PRATA", name: "LULI SUPREMACY", image: "/assets/sticker_08_luli_supremacy.png" },
  { id: 9, tier: "PRATA", name: "LULI BRABA", image: "/assets/sticker_09_luli_braba.png" },
  { id: 10, tier: "PRATA", name: "RAINHA LULI", image: "/assets/sticker_10_rainha_luli.png" },
  { id: 11, tier: "PRATA", name: "LULI GOSTOSA", image: "/assets/sticker_11_luli_gostosa.png" },
  { id: 12, tier: "PRATA", name: "LULI.EXE", image: "/assets/sticker_12_luli_exe.png" },
  { id: 13, tier: "OURO", name: "LULI LENDÁRIA", image: "/assets/sticker_13_luli_lendaria.png" },
  { id: 14, tier: "OURO", name: "EU ♥ LULI", image: "/assets/sticker_14_eu_luli.png" },
  { id: 15, tier: "OURO", name: "A DONA DO JOGO", image: "/assets/sticker_15_a_dona_do_jogo.png" },
  { id: 16, tier: "OURO", name: "TOTO PARA SEMPRE", image: "/assets/sticker_16_toto_para_sempre.png" },
  { id: 17, tier: "OURO", name: "LULI CLT", image: "/assets/sticker_17_luli_clt.png" },
];
type AlbumProgress = { points: number; goldenCards: number; fragments: number; owned: number[] };
const EMPTY_ALBUM: AlbumProgress = { points: 0, goldenCards: 0, fragments: 0, owned: [] };
const readAlbum = (): AlbumProgress => { try { const saved = JSON.parse(localStorage.getItem("luli-album") || "{}"); return { ...EMPTY_ALBUM, ...saved, goldenCards: saved.goldenCards ?? saved.vouchers ?? 0 }; } catch { return EMPTY_ALBUM; } };

function FruitBadge({ fruit, small = false }: { fruit: FruitDefinition; small?: boolean }) {
  return <img className={`fruit-badge ${small ? "fruit-badge--small" : ""}`} src={fruit.image} alt={fruit.name} />;
}

function drawFruit(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fruit: FruitDefinition, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.shadowColor = "rgba(20, 54, 60, .20)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fillStyle = fruit.color; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.lineWidth = Math.max(2.5, radius * .075); ctx.strokeStyle = "#174A4B"; ctx.stroke();
  const glow = ctx.createRadialGradient(-radius * .34, -radius * .42, 2, -radius * .2, -radius * .2, radius * .9); glow.addColorStop(0, "rgba(255,255,255,.75)"); glow.addColorStop(.16, "rgba(255,255,255,.25)"); glow.addColorStop(1, "rgba(255,255,255,0)"); ctx.beginPath(); ctx.arc(0, 0, radius - 3, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
  const seedCount = Math.min(8, Math.max(2, fruit.level + 1));
  for (let i = 0; i < seedCount; i++) { const a = (Math.PI * 2 * i) / seedCount + .3; const sx = Math.cos(a) * radius * .47; const sy = Math.sin(a) * radius * .47; ctx.beginPath(); ctx.ellipse(sx, sy, radius * .045, radius * .11, a, 0, Math.PI * 2); ctx.fillStyle = "rgba(23,74,75,.52)"; ctx.fill(); }
  ctx.restore();
}

const fruitImages = new Map<string, HTMLImageElement>();

function loadFruitImage(fruit: FruitDefinition) {
  if (!fruitImages.has(fruit.id)) {
    const image = new Image();
    image.src = fruit.image;
    fruitImages.set(fruit.id, image);
  }
  return fruitImages.get(fruit.id);
}

function drawFruitImage(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fruit: FruitDefinition, angle: number) {
  const image = loadFruitImage(fruit);
  if (!image || !image.complete || image.naturalWidth === 0) {
    drawFruit(ctx, x, y, radius, fruit, angle);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null); const gameRef = useRef<FruitGame | null>(null); const frameRef = useRef<number>(0); const previewX = useRef(180); const previewY = useRef(42);
  const stateRef = useRef<GameSnapshot | null>(null);
  const [screen, setScreen] = useState<"menu" | "loading" | "game" | "help" | "settings" | "album">("menu"); const [state, setState] = useState<GameSnapshot | null>(null); const [sound, setSound] = useState(() => localStorage.getItem("luli-sound") !== "off"); const [effects, setEffects] = useState(true); const [album, setAlbum] = useState<AlbumProgress>(() => readAlbum());
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [drawOptions, setDrawOptions] = useState<typeof STICKERS>([]);
  const [revealedSticker, setRevealedSticker] = useState<typeof STICKERS[number] | null>(null);
  const [testCode, setTestCode] = useState("");
  const previousScore = useRef(0);
  const [flash, setFlash] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (screen !== "loading") return;
    const timer = window.setTimeout(() => { gameRef.current?.reset(); setScreen("game"); }, 5000);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "game") return;
    const blockBrowserZoom = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) event.preventDefault();
    };
    window.addEventListener("keydown", blockBrowserZoom);
    return () => window.removeEventListener("keydown", blockBrowserZoom);
  }, [screen]);

  const saveAlbum = (next: AlbumProgress) => { setAlbum(next); localStorage.setItem("luli-album", JSON.stringify(next)); };
  const announce = (message: string) => { setRewardNotice(message); window.setTimeout(() => setRewardNotice(null), 3500); };
  const awardGoldenCard = (progress: AlbumProgress, message: string): AlbumProgress => { const next = { ...progress, goldenCards: progress.goldenCards + 1 }; announce(message); return next; };
  const createDrawOptions = () => { const shuffled = [...STICKERS].sort(() => Math.random() - 0.5); setDrawOptions(shuffled.slice(0, 3)); };
  const generateSticker = () => { if (album.goldenCards > 0) saveAlbum({ ...album, goldenCards: album.goldenCards - 1 }); else if (album.fragments >= 3) saveAlbum({ ...album, fragments: album.fragments - 3 }); else return; createDrawOptions(); };
  const chooseSticker = (sticker: typeof STICKERS[number]) => { const repeated = album.owned.includes(sticker.id); const next = repeated ? { ...album, fragments: album.fragments + 1 } : { ...album, owned: [...album.owned, sticker.id] }; saveAlbum(next); setDrawOptions([]); setRevealedSticker(sticker); announce(repeated ? `${sticker.name} repetido: +1 fragmento.` : `Sticker conquistado: ${sticker.name}!`); };
  const applyTestCode = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (testCode.toLowerCase() === "christiano") { saveAlbum({ ...album, goldenCards: album.goldenCards + 50 }); announce("Teste ativado: +50 Cartas Douradas!"); setTestCode(""); } };

  useEffect(() => {
    if (!state) return;
    const gained = state.score >= previousScore.current ? state.score - previousScore.current : state.score;
    previousScore.current = state.score;
    if (!gained) return;
    const before = album;
    const total = before.points + gained;
    const vouchers = Math.floor(total / 100000);
    if (!vouchers) { if (total !== before.points) saveAlbum({ ...before, points: total }); return; }
    let next = { ...before, points: total % 100000 };
    for (let i = 0; i < vouchers; i++) next = awardGoldenCard(next, "Você ganhou 1 Carta Dourada!");
    saveAlbum(next);
  }, [state?.score]);

  useEffect(() => { const game = new FruitGame(); gameRef.current = game; const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; game.resize(rect.width, rect.height); };
    resize(); window.addEventListener("resize", resize); const unsubscribe = game.subscribe(setState); const unmerge = game.onMerge((x, y, level) => { setFlash({ x, y, text: `+${getFruit(level).score}` }); window.setTimeout(() => setFlash(null), 500); if (level === 10) { const next = readAlbum(); next.fragments += 1; saveAlbum(next); announce("Você ganhou 1 Fragmento de Carta Dourada!"); } });
    const draw = () => { game.update(); const ctx = canvas.getContext("2d"); if (ctx) { const dpr = canvas.width / canvas.getBoundingClientRect().width; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const w = canvas.clientWidth, h = canvas.clientHeight; const snapshot = stateRef.current; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(240,93,94,.08)"; ctx.fillRect(0, 0, w, h); ctx.setLineDash([5, 7]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(240,93,94,.8)"; ctx.beginPath(); ctx.moveTo(8, 82); ctx.lineTo(w - 8, 82); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(240,93,94,.8)"; ctx.font = "700 10px DM Sans"; ctx.fillText("ZONA DE PERIGO", 14, 73);
      game.getBodies().forEach(body => { const fruit = getFruit(body.fruitLevel || 1); drawFruitImage(ctx, body.position.x, body.position.y, fruit.radius, fruit, body.angle); });
      game.particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      if (screen === "game" && !snapshot?.over && !snapshot?.paused) { const next = snapshot?.next; if (next) { ctx.save(); ctx.globalAlpha = .22; ctx.setLineDash([4, 8]); ctx.strokeStyle = "#174A4B"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(previewX.current, Math.max(58 + next.radius, previewY.current - 8)); ctx.lineTo(previewX.current, h - 9); ctx.stroke(); ctx.restore(); ctx.globalAlpha = .8; drawFruitImage(ctx, previewX.current, previewY.current, next.radius, next, 0); ctx.globalAlpha = 1; } }
    } frameRef.current = requestAnimationFrame(draw); }; frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("resize", resize); unsubscribe(); unmerge(); };
  }, [screen]);

  useEffect(() => { gameRef.current?.setAudio(sound); localStorage.setItem("luli-sound", sound ? "on" : "off"); }, [sound]);
  const start = () => { setScreen("loading"); };
  const leaveGame = () => { if (window.confirm("Todo o progresso desta partida será encerrado. Voltar ao menu?")) { gameRef.current?.reset(); setScreen("menu"); } };
  const restartSave = () => { if (!window.confirm("Apagar todo o progresso do álbum e o recorde?")) return; localStorage.removeItem("luli-album"); localStorage.removeItem("luli-best"); setAlbum(EMPTY_ALBUM); gameRef.current?.reset(); setState(null); announce("Novo save criado."); };
  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = stateRef.current?.next ?? FRUITS[0];
    const radius = next.radius;
    previewX.current = Math.max(radius + 4, Math.min(rect.width - radius - 4, event.clientX - rect.left));
    previewY.current = 42;
  };
  const pointerStart = (event: React.PointerEvent<HTMLCanvasElement>) => { event.currentTarget.setPointerCapture?.(event.pointerId); pointerPosition(event); };
  const drop = (event: React.PointerEvent<HTMLCanvasElement>) => { pointerPosition(event); gameRef.current?.drop(previewX.current); };
  const key = (event: React.KeyboardEvent) => { if (event.key === "ArrowLeft") previewX.current -= 18; if (event.key === "ArrowRight") previewX.current += 18; if (event.key === " " || event.key === "Enter") gameRef.current?.drop(previewX.current); if (event.key === "Escape") gameRef.current?.togglePause(); };

  return <main className="app-shell"><div className="paper-speckles" />
    {screen === "loading" && <section className="loading-screen" aria-label="A carregar o jogo"><div className="loading-progress"><div className="loading-progress-bar" /></div><span>A PREPARAR O JOGO</span></section>}
    <header className="topbar"><button className="brand" onClick={() => setScreen("menu")}><img src={LOGO} alt="" /><span className="brand-wordmark">LULI <b>FRUIT</b><i aria-hidden="true" /></span></button><div className="topbar-note">A tua pausa mais saborosa</div><button className="sound-button" aria-label={sound ? "Desligar som" : "Ligar som"} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button></header>
    {screen === "menu" && <section className="menu-layout"><div className="menu-copy"><p className="eyebrow">PEQUENAS FRUTAS. GRANDES FUSÕES.</p><h1>Junta tudo<br /><em>com sabor.</em></h1><p className="intro">Deixa cair, combina frutas iguais e vê até onde consegues chegar antes de encher o frasco.</p><button className="primary-button" onClick={start}>JOGAR AGORA <span>→</span></button><div className="menu-links"><button onClick={() => setScreen("help")}><HelpCircle size={17} /> Como jogar</button><button onClick={() => setScreen("album")}><Images size={17} /> Álbum</button><button onClick={() => setScreen("settings")}><Settings2 size={17} /> Definições</button><button className="restart-save-button" onClick={restartSave}><RotateCcw size={15} /> Recomeçar</button></div></div><div className="menu-art"><div className="sticker sticker-top">NOVIDADE<br /><strong>+10</strong> frutas</div><img className="menu-logo" src={LOGO} alt="Luli Fruit" /><div className="menu-score-card"><span>RECORDE ATUAL</span><strong>{state?.best || 0}</strong><i>continua a subir</i></div></div></section>}
    {screen === "game" && <section className="game-layout"><aside className="game-sidebar"><div className="score-label">PONTUAÇÃO<strong>{state?.score || 0}</strong></div><div className="best-label">RECORDE <b>{state?.best || 0}</b></div><div className="next-card"><span>PRÓXIMA</span>{state?.next && <><FruitBadge fruit={state.next} small /><b>{state.next.name}</b></>}</div>
        <div style={{ marginTop: 16, borderRadius: 12, background: "rgba(240, 93, 94, 0.10)", border: "1px solid rgba(240, 93, 94, 0.3)", padding: "10px 12px", color: "#4a1b1b" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>Zona de perigo</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: "#d94d52" }}>{state && state.dangerMs > 0 ? `${Math.max(1, Math.ceil(state.dangerMs / 1000))}s` : "0s"}</div>
        </div>
        <div className="tip-card"><span>DICA DO DIA <i className="seed-stamp" /></span><p>Frutas pequenas deixam mais espaço para as grandes.</p></div><button className="pause-button" onClick={() => gameRef.current?.togglePause()}>{state?.paused ? <Play size={17} /> : <Pause size={17} />}{state?.paused ? "CONTINUAR" : "PAUSAR"}</button></aside><div className="board-wrap">{rewardNotice && <div className="reward-notice">{rewardNotice}</div>}<div className="board-heading"><span className="stamp-label">RONDA LIVRE</span><small>Rato / toque para posicionar · clique para largar</small></div><div className="board"><canvas ref={canvasRef} onPointerMove={pointerPosition} onPointerDown={pointerStart} onPointerUp={drop} onKeyDown={key} tabIndex={0} aria-label="Tabuleiro de LULI FRUIT" />{flash && effects && <div className="merge-flash" style={{ left: flash.x, top: flash.y }}>{flash.text}</div>}{state?.paused && <div className="modal-cover"><div className="modal-card"><span className="modal-kicker">A FRUTEIRA EM PAUSA</span><h2>Respira.<br /><em>Já voltamos.</em></h2><button className="primary-button" onClick={() => gameRef.current?.togglePause()}>CONTINUAR <Play size={16} /></button><button className="text-button" onClick={start}><RotateCcw size={15} /> Recomeçar</button></div></div>}{state?.over && <div className="modal-cover"><div className="modal-card"><span className="modal-kicker">A FRUTEIRA FICOU CHEIA</span><h2>Boa colheita.<br /><em>Outra vez?</em></h2><div className="final-score"><span>PONTUAÇÃO</span><b>{state.score}</b></div><button className="primary-button" onClick={start}>JOGAR NOVAMENTE <RotateCcw size={16} /></button><button className="text-button" onClick={() => setScreen("menu")}><ChevronLeft size={15} /> Menu principal</button></div></div>}</div></div></section>}
    {screen === "album" && <section className="album-page"><button className="back-link" onClick={() => setScreen("menu")}><ChevronLeft size={17} /> Voltar</button><div className="album-heading"><div><p className="eyebrow">COLEÇÃO DE PRÉMIOS</p><h2>Álbum <em>Luli</em></h2></div><div className="album-counters"><span><img src="/assets/cartadourada.PNG" alt="" /> CARTAS DOURADAS <b>{album.goldenCards}</b></span><span><img src="/assets/fragmentocartadourada.PNG" alt="" /> FRAGMENTOS <b>{album.fragments}/3</b></span></div></div><p className="album-progress">{album.owned.length} de {STICKERS.length} stickers conquistados · {album.points.toLocaleString("pt-PT")} pontos para a próxima carta</p><div className="album-actions"><button className="primary-button" disabled={album.goldenCards < 1 && album.fragments < 3} onClick={generateSticker}>GERAR STICKER <Images size={16} /></button><span>1 carta dourada ou 3 fragmentos</span></div>{(["BRONZE", "PRATA", "OURO"] as const).map(tier => <div className="sticker-tier" key={tier}><h3>{tier}</h3><div className="sticker-grid">{STICKERS.filter(sticker => sticker.tier === tier).map(sticker => <div className={`sticker-item ${album.owned.includes(sticker.id) ? "is-owned" : "is-locked"}`} key={sticker.id}><img src={sticker.image} alt={album.owned.includes(sticker.id) ? sticker.name : "Sticker bloqueado"} /><span>{album.owned.includes(sticker.id) ? sticker.name : "BLOQUEADO"}</span></div>)}</div></div>)}<div className="album-rules"><strong>Como ganhar</strong><span>100.000 pontos = 1 Carta Dourada</span><span>Cada Coco que aparecer = 1 Fragmento</span><span>Sticker repetido = 1 fragmento</span></div>{drawOptions.length > 0 && <div className="draw-overlay"><div className="draw-modal"><button className="draw-close" onClick={() => setDrawOptions([])} aria-label="Fechar">×</button><p className="eyebrow">ESCOLHE UMA CARTA</p><h2>Qual será o teu sticker?</h2><div className="draw-cards">{drawOptions.map(sticker => <button className="draw-card" key={sticker.id} onClick={() => chooseSticker(sticker)}><img src="/assets/cartadourada.PNG" alt="Carta dourada" /><span>ESCOLHER</span></button>)}</div></div></div>}</section>}
    {(screen === "help" || screen === "settings") && <section className="simple-page"><button className="back-link" onClick={() => setScreen("menu")}><ChevronLeft size={17} /> Voltar</button>{screen === "help" ? <><p className="eyebrow">UM GUIA EM DUAS MORDIDAS</p><h2>Como jogar</h2><div className="guide-grid"><div><strong>01</strong><h3>Posiciona</h3><p>Move o cursor ou o dedo para escolher onde a fruta vai cair.</p></div><div><strong>02</strong><h3>Solta</h3><p>Clica, toca ou prime Espaço. A gravidade trata do resto.</p></div><div><strong>03</strong><h3>Combina</h3><p>Duas frutas iguais juntam-se e criam uma fruta maior.</p></div></div><button className="primary-button" onClick={start}>JOGAR AGORA <span>→</span></button></> : <><p className="eyebrow">A TUA FRUTEIRA, AS TUAS REGRAS</p><h2>Definições</h2><div className="settings-card"><label>Som <button onClick={() => setSound(!sound)}>{sound ? "LIGADO" : "DESLIGADO"}<span className={`toggle ${sound ? "on" : ""}`} /></button></label><label>Efeitos visuais <button onClick={() => setEffects(!effects)}>{effects ? "LIGADOS" : "DESLIGADOS"}<span className={`toggle ${effects ? "on" : ""}`} /></button></label></div></>}</section>}
    {revealedSticker && <div className="reveal-overlay"><div className="reveal-modal"><button className="reveal-close" onClick={() => setRevealedSticker(null)} aria-label="Fechar">×</button><p>STICKER CONQUISTADO</p><img src={revealedSticker.image} alt={revealedSticker.name} /><h2>{revealedSticker.name}</h2><button className="primary-button" onClick={() => setRevealedSticker(null)}>FECHAR</button></div></div>}
    {screen === "game" && <div className="card-progress"><span>PRÓXIMA CARTA</span><strong>{Math.max(0, 100000 - album.points).toLocaleString("pt-PT")}</strong><small>pontos restantes</small></div>}
    <footer className="footer-note">LULI FRUIT <span>feito para jogar mais uma</span></footer>
    {screen === "album" && <form className="test-code" onSubmit={applyTestCode}><input value={testCode} onChange={event => setTestCode(event.target.value.slice(0, 10))} maxLength={10} minLength={10} placeholder="código" aria-label="Código de teste" /><button type="submit" aria-label="Ativar código">OK</button></form>}
    {state?.paused && <button className="paused-menu-button" onClick={leaveGame}><ChevronLeft size={15} /> Voltar ao Menu</button>}
  </main>;
}

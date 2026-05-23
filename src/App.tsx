import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Wand2, Download, ChevronLeft, ChevronRight, Share2, Terminal } from "lucide-react";
import Markdown from "react-markdown";
import html2canvas from "html2canvas";

interface SlideContent {
  title: string;
  body: string;
}

export default function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleSummarize = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.markdown) {
        setMarkdown(data.markdown);
        parseMarkdown(data.markdown);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (md: string) => {
    // Split by H2 (##)
    const sections = md.split(/##\s+/).filter(Boolean);
    const mainTitleLine = sections[0].split('\n').find(l => l.startsWith('# ')) || "# Logic Overview";
    const mainTitle = mainTitleLine.replace('# ', '').trim();
    
    // The first section might contain the H1 title
    // If it has a ## title, treat it as the first real slide if it's not the H1 section
    const formattedSlides = sections.slice(1).map((section) => {
      const [title, ...bodyLines] = section.split('\n');
      return {
        title: title.trim(),
        body: bodyLines.join('\n').trim(),
      };
    }).filter(s => s.title);

    // Add an intro slide
    const allSlides = [
      { title: mainTitle, body: "Swipe to see the breakdown of this logic →" },
      ...formattedSlides,
      { title: "Thanks for Reading!", body: "Follow for more technical deep dives and coding tips." }
    ];

    setSlides(allSlides);
    setCurrentIndex(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const element = slidesRef.current[i];
        if (element) {
          const canvas = await html2canvas(element, {
            width: 1080,
            height: 1080,
            scale: 1, // 1:1 scale for 1080x1080
            useCORS: true,
            backgroundColor: "#1a1a1a"
          });
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `slide-${i + 1}.png`;
          link.href = dataUrl;
          link.click();
          // Small delay to prevent browser from blocking multiple downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1a1a1a] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#1a1a1a] p-1.5 rounded-lg">
            <Code2 className="w-5 h-5 text-[#F5F5F0]" />
          </div>
          <h1 className="text-xl font-medium tracking-tight">Code2Carousel AI</h1>
        </div>
        <div className="flex items-center gap-4">
          {slides.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {exporting ? "Exporting..." : <><Download className="w-4 h-4" /> Export All PNGs</>}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 h-[calc(100vh-73px)]">
        {/* Left Pane: Input */}
        <section className="flex flex-col gap-6 overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest font-semibold opacity-50 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Raw Snippet
              </label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs bg-white border border-[#1a1a1a]/10 rounded px-2 py-1 outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
              </select>
            </div>
            <div className="relative group">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your logic here..."
                className="w-full h-96 bg-white p-6 rounded-3xl border border-[#1a1a1a]/10 shadow-sm outline-none focus:border-[#5A5A40] transition-colors font-mono text-sm resize-none"
              />
              <button
                onClick={handleSummarize}
                disabled={loading || !code}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-2xl font-medium hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {loading ? "Thinking..." : <><Wand2 className="w-4 h-4" /> Generate Carousel</>}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white/50 rounded-3xl border border-dashed border-[#1a1a1a]/20 p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <Share2 className="w-6 h-6 text-[#5A5A40]" />
            </div>
            <h3 className="text-lg font-medium mb-2">Technical Storytelling</h3>
            <p className="text-sm text-[#1a1a1a]/60 max-w-xs">
              Gemini will extract the 5 most important insights and structure them for educational engagement.
            </p>
          </div>
        </section>

        {/* Right Pane: Preview */}
        <section className="flex flex-col items-center justify-center gap-8 relative">
          {slides.length > 0 ? (
            <>
              <div className="relative w-full flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative aspect-square w-full max-w-[540px] shadow-2xl rounded-xl overflow-hidden bg-white"
                  >
                    {/* The Actual 1080x1080 Content (scaled down for preview) */}
                    <div 
                      className="absolute top-0 left-0 w-[1080px] h-[1080px] origin-top-left flex flex-col justify-center p-20 bg-[#1a1a1a] text-[#F5F5F0]"
                      style={{ transform: 'scale(0.5)' }}
                    >
                      <div className="flex-1 flex flex-col justify-center gap-12">
                        <div className="space-y-4">
                          <span className="text-[#5A5A40] font-mono text-4xl uppercase tracking-[0.2em] font-bold">
                            Slide 0{currentIndex + 1}
                          </span>
                          <h2 className="text-8xl font-bold leading-[1.1] tracking-tight">
                            {slides[currentIndex].title}
                          </h2>
                        </div>
                        <div className="h-1 w-32 bg-[#5A5A40]" />
                        <div className="text-4xl text-[#F5F5F0]/70 leading-relaxed max-w-4xl">
                           <Markdown>{slides[currentIndex].body}</Markdown>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-[#F5F5F0]/10 pt-12">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                              <Code2 className="w-6 h-6 text-[#1a1a1a]" />
                           </div>
                           <span className="text-2xl font-medium tracking-tight">Code2Carousel</span>
                        </div>
                        <span className="text-2xl opacity-40 font-mono tracking-tighter">
                          1080 x 1080 px
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 -right-4 flex justify-between pointer-events-none">
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-3 bg-white shadow-xl rounded-full pointer-events-auto hover:bg-gray-50 disabled:opacity-0 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentIndex === slides.length - 1}
                    className="p-3 bg-white shadow-xl rounded-full pointer-events-auto hover:bg-gray-50 disabled:opacity-0 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? "w-8 bg-[#5A5A40]" : "w-2 bg-[#1a1a1a]/10"
                    }`}
                  />
                ))}
              </div>

              {/* Hidden collection for export */}
              <div className="fixed top-[-9999px] left-[-9999px]">
                {slides.map((slide, i) => (
                  <div
                    key={i}
                    ref={(el) => {
                      slidesRef.current[i] = el;
                    }}
                    className="w-[1080px] h-[1080px] flex flex-col justify-center p-20 bg-[#1a1a1a] text-[#F5F5F0]"
                  >
                    <div className="flex-1 flex flex-col justify-center gap-12">
                        <div className="space-y-4">
                          <span className="text-[#5A5A40] font-mono text-4xl uppercase tracking-[0.2em] font-bold">
                            Slide 0{i + 1}
                          </span>
                          <h2 className="text-8xl font-bold leading-[1.1] tracking-tight">
                            {slide.title}
                          </h2>
                        </div>
                        <div className="h-1 w-32 bg-[#5A5A40]" />
                        <div className="text-4xl text-[#F5F5F0]/70 leading-relaxed max-w-4xl">
                           <Markdown>{slide.body}</Markdown>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-[#F5F5F0]/10 pt-12">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                              <Code2 className="w-6 h-6 text-[#1a1a1a]" />
                           </div>
                           <span className="text-2xl font-medium tracking-tight">Code2Carousel</span>
                        </div>
                        <span className="text-2xl opacity-40 font-mono tracking-tighter">
                          1080 x 1080 px
                        </span>
                      </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center opacity-30 select-none">
              <div className="aspect-square w-96 border-4 border-dashed border-[#1a1a1a] rounded-3xl flex items-center justify-center mb-6">
                <Share2 className="w-16 h-16" />
              </div>
              <p className="text-sm font-mono uppercase tracking-widest">Awaiting Generation</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

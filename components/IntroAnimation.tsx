const IntroAnimation = () => (
    <div className="w-screen h-screen bg-[var(--bg-primary)] flex justify-center items-center">
        <div className="text-5xl font-bold text-center">
            <span className="inline-block animate-fade-up" style={{ animationDelay: '0.2s' }}>CO</span>
            <span className="inline-block text-[var(--text-accent)] animate-draw-slash" style={{ animationDelay: '0.7s' }}>/</span>
            <span className="inline-block font-light animate-fade-up" style={{ animationDelay: '1.2s' }}>Chemistry</span>
        </div>
    </div>
);

export default IntroAnimation;
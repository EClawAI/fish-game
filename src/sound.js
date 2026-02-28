// 音效管理器
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.bgmPlaying = false;
        this.bgmGain = null;
        this.enabled = true;
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            } else {
                this.enabled = false;
            }
        } catch (e) {
            this.enabled = false;
        }
    }

    playEatSound(size) {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.value = 800 - size * 5;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playSpecialSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99];
        const now = this.audioContext.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    playGameOverSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [392, 370, 349, 311];
        const now = this.audioContext.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'triangle';
            
            gain.gain.setValueAtTime(0.15, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    }

    startBGM() {
        if (!this.enabled || !this.audioContext || this.bgmPlaying) return;
        
        this.bgmPlaying = true;
        
        // 创建主音量控制
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.connect(this.audioContext.destination);
        this.bgmGain.gain.value = 0.08;
        
        // 海洋气泡声 - 布鲁布鲁效果
        const now = this.audioContext.currentTime;
        const bubbleFreqs = [180, 220, 280];
        
        this.bgmOscillators = bubbleFreqs.map((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            // LFO 调制产生"布鲁布鲁"效果
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 2 + i * 0.5;
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 0.3;
            
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            
            gain.gain.value = 0.02;
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.start(now + i * 0.3);
            lfo.start(now + i * 0.3);
            
            return { osc, lfo, gain };
        });
    }

    stopBGM() {
        if (this.bgmGain) {
            const now = this.audioContext.currentTime;
            this.bgmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        }
        
        this.bgmOscillators.forEach(({ osc, lfo }) => {
            try {
                osc.stop(this.audioContext.currentTime + 0.3);
                lfo.stop(this.audioContext.currentTime + 0.3);
            } catch (e) {}
        });
        
        this.bgmPlaying = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        return this.enabled;
    }
}

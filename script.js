const YOUR_START_DATE = "2025-12-06"; // THAY ĐỔI NGÀY Ở ĐÂY (YYYY-MM-DD)

// 1. Cập nhật số ngày đã yêu nhau ngay lập tức
function updateDaysCounter() {
    const start = new Date(YOUR_START_DATE);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    document.getElementById('days-display').innerText = `${diff.toLocaleString()} Days Together`;
}
updateDaysCounter();

// 2. Wheel population & defaults
function pad(n){ return n < 10 ? '0'+n : ''+n; }
function populateWheels(){
    const day = document.getElementById('wheel-day');
    const month = document.getElementById('wheel-month');
    const year = document.getElementById('wheel-year');
    day.innerHTML = '';
    month.innerHTML = '';
    year.innerHTML = '';
    for(let d=1; d<=31; d++) day.insertAdjacentHTML('beforeend', `<option value="${pad(d)}">${pad(d)}</option>`);
    for(let m=1; m<=12; m++) month.insertAdjacentHTML('beforeend', `<option value="${pad(m)}">${pad(m)}</option>`);
    const now = new Date();
    const thisYear = now.getFullYear();
    const startYear = Math.max(thisYear-30, 1990);
    for(let y=startYear; y<=thisYear+1; y++) year.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);

    // hide wrong feedback when user interacts with wheels
    [day, month, year].forEach(el => {
        el.addEventListener('focus', hideWrongFeedback);
        el.addEventListener('change', hideWrongFeedback);
    });
}

function setWheelsToToday(){
    const today = new Date();
    document.getElementById('wheel-day').value = pad(today.getDate());
    document.getElementById('wheel-month').value = pad(today.getMonth()+1);
    document.getElementById('wheel-year').value = today.getFullYear();
}

populateWheels();
setWheelsToToday();

// 3. Handle check
function handleCheckDate(){
    const audio = document.getElementById('bg-music');
    audio.play().catch(()=>console.log('Audio blocked - interaction required'));

    const d = document.getElementById('wheel-day').value;
    const m = document.getElementById('wheel-month').value;
    const y = document.getElementById('wheel-year').value;

    const selected = `${y}-${m}-${d}`;

    if(selected === YOUR_START_DATE){
        showCorrectFeedback();
    } else {
        showWrongFeedback();
    }
}

// 4. Wrong feedback
function showWrongFeedback(){
    const wrong = document.getElementById('wrong-msg');
    const img = document.getElementById('image-choice');
    document.body.classList.add('flash-pink');
    setTimeout(()=>document.body.classList.remove('flash-pink'), 600);

    // show image with animation
    img.classList.remove('hidden');
    img.classList.remove('animate__fadeOutUp');
    img.classList.add('animate__fadeInUp', 'animate__bounce');

    wrong.classList.remove('hidden');
    wrong.classList.remove('animate__fadeOut');
    wrong.classList.add('animate__tada');
    setTimeout(()=>wrong.classList.remove('animate__tada'), 1200);
}

function hideWrongFeedback(){
    const wrong = document.getElementById('wrong-msg');
    const img = document.getElementById('image-choice');
    if(!wrong.classList.contains('hidden')){
        wrong.classList.add('animate__fadeOut');
        setTimeout(()=> wrong.classList.add('hidden'), 400);
    }
    if(!img.classList.contains('hidden')){
        img.classList.remove('animate__fadeInUp', 'animate__bounce');
        img.classList.add('animate__fadeOutUp');
        setTimeout(()=> img.classList.add('hidden'), 400);
    }
}

// 5. Correct feedback + transition
function showCorrectFeedback(){
    const card = document.querySelector('.glass-card');
    // inline success message
    let msg = document.getElementById('success-inline');
    if(!msg){
        msg = document.createElement('div');
        msg.id = 'success-inline';
        msg.className = 'success-inline animate__animated animate__fadeIn';
        msg.innerText = 'Đúng rồi nèee 💖';
        card.appendChild(msg);
    }
    document.body.classList.add('pink-bright');

    // small heart burst
    try{ fireworkHeart(); }catch(e){}

    setTimeout(()=>{
        // proceed to transition
        startTransition();
    }, 1400);
}

// 6. Transition & timeline scrolling
function startTransition() {
    document.getElementById('screen-1').classList.add('animate__animated', 'animate__fadeOut');
    
    setTimeout(() => {
        document.getElementById('screen-1').classList.add('hidden');
        const s2 = document.getElementById('screen-2');
        s2.classList.remove('hidden');
        s2.classList.add('animate__animated', 'animate__fadeIn');

        // show toast/modal for 2.5s then allow scroll interactions
        const toast = document.getElementById('timeline-toast');
        toast.classList.remove('hidden');
        toast.classList.remove('animate__fadeOutUp');
        toast.classList.add('animate__fadeInDown');

        // init AOS for scroll animations
        AOS.init({ duration: 900, once: true, offset: 100 });

        // update timeline-days summary
        const timelineDays = document.getElementById('timeline-days');
        try{ timelineDays.innerText = Math.floor((new Date() - new Date(YOUR_START_DATE))/(1000*60*60*24)); }catch(e){}

        // play bg music for timeline (if not already)
        const audio = document.getElementById('bg-music');
        audio.play().catch(()=>{});

        // prepare image fallbacks
        setupImageFallbacks();

        // observer for timeline-end to show CTA
        setupTimelineEndObserver();

        // adjust main line so it ends at the today dot
        setTimeout(() => adjustMainLine(), 220);

        setTimeout(() => {
            toast.classList.remove('animate__fadeInDown');
            toast.classList.add('animate__fadeOutUp');
            setTimeout(()=> toast.classList.add('hidden'), 600);
        }, 20000);
    }, 900);
}

// Replace missing images with a cute placeholder
function setupImageFallbacks(){
    const imgs = document.querySelectorAll('.img-item img');
    imgs.forEach(img => {
        img.addEventListener('error', ()=>{
            const figure = img.closest('figure.img-item');
            if(!figure) return;
            const caption = figure.querySelector('figcaption') ? figure.querySelector('figcaption').innerText : '';
            figure.outerHTML = `<div class="img-missing animate__animated animate__bounce"><span class="small-icon">🐻</span><div>Buổi này anh quên chụp hình mất rồi…<br><small>${caption ? caption : 'Nhưng cảm xúc thì anh nhớ rõ lắm đó 😚' }</small></div></div>`;
        });
        // if image 0x0 once loaded
        img.addEventListener('load', ()=>{
            if(img.naturalWidth === 0){
                img.dispatchEvent(new Event('error'));
            }
        });
    });
}

// Lightbox / modal behavior for images
function initLightbox(){
    document.body.addEventListener('click', (e)=>{
        const img = e.target.closest && e.target.closest('.img-item img');
        if(img){
            openModal(img.src, img.closest('figure') ? (img.closest('figure').querySelector('figcaption')||{innerText:''}).innerText : '');
        }
    });

    const modal = document.getElementById('image-modal');
    if(!modal) return;
    const backdrop = modal.querySelector('.modal-backdrop');
    const closeBtn = modal.querySelector('.close-btn');

    function doClose(){ closeModal(); }
    backdrop && backdrop.addEventListener('click', doClose);
    closeBtn && closeBtn.addEventListener('click', doClose);
    document.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape') closeModal(); });
}

function openModal(src, caption){
    const modal = document.getElementById('image-modal');
    if(!modal) return;
    const img = modal.querySelector('#modal-img');
    const cap = modal.querySelector('.modal-caption');
    img.src = src;
    cap.innerText = caption || '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
}

function closeModal(){
    const modal = document.getElementById('image-modal');
    if(!modal) return;
    const img = modal.querySelector('#modal-img');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    img.src = '';
}

// Show CTA when reaching timeline end
function setupTimelineEndObserver(){
    // Observe the special today timeline-item to reveal the internal CTA and mark visible state
    const today = document.querySelector('.timeline-item.is-today');
    if(!today) return;

    const btn = today.querySelector('.next-btn');
    if(btn){
        btn.addEventListener('click', ()=>{
            document.getElementById('screen-2').classList.add('hidden');
            document.getElementById('screen-3').classList.remove('hidden');
            fireworkHeart();
        });
    }

    const obs = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                today.classList.add('visible');
            } else {
                today.classList.remove('visible');
            }
        });
    }, { root: null, threshold: 0.55 });

    obs.observe(today);
}

// Adjust main-line height so it ends at the center of the .is-today dot
function adjustMainLine(){
    const wrapper = document.querySelector('.timeline-wrapper');
    const mainLine = document.querySelector('.main-line');
    const today = document.querySelector('.timeline-item.is-today');
    if(!wrapper || !mainLine || !today) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const dot = today.querySelector('.dot');
    if(!dot) return;
    const dotRect = dot.getBoundingClientRect();

    // compute offset from top of wrapper to center of dot
    const centerY = dotRect.top + dotRect.height/2 - wrapperRect.top;
    // limit min/max
    const height = Math.max(40, centerY);
    mainLine.style.height = `${height}px`;
}

// recalc on resize / after layout
window.addEventListener('resize', ()=>{ setTimeout(adjustMainLine, 120); });

function autoScrollTimeline() {
    const duration = 15000; // 15 giây để cuộn hết (có thể điều chỉnh)
    const start = window.pageYOffset;
    const end = document.body.scrollHeight;
    const startTime = performance.now();

    function scroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        window.scrollTo(0, start + (end - start) * progress);

        if (progress < 1) {
            requestAnimationFrame(scroll);
        } else {
            // Sau khi cuộn xong thì tự động chuyển sang màn 3
            setTimeout(() => {
                document.getElementById('screen-2').classList.add('hidden');
                document.getElementById('screen-3').classList.remove('hidden');
                fireworkHeart();
            }, 1200);
        }
    }
    requestAnimationFrame(scroll);
}

// 7. Hiệu ứng pháo hoa hình trái tim (reuse)
function fireworkHeart() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ff4d6d', '#ff8fa3', '#ffccd5', '#ffb3c1']; // Các tông màu hồng

    (function frame() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) return;

        const particleCount = 50 * (timeLeft / duration);
        
        // Bắn từ hai phía trái phải vào giữa
        confetti({
            particleCount,
            spread: 70,
            origin: { x: 0, y: 0.6 },
            colors: colors,
            shapes: ['heart'] // Thư viện canvas-confetti hỗ trợ hình trái tim nếu được setup
        });
        confetti({
            particleCount,
            spread: 70,
            origin: { x: 1, y: 0.6 },
            colors: colors,
            shapes: ['heart']
        });

        if (timeLeft > 0) {
            requestAnimationFrame(frame);
        }
    }());
}

// ensure AOS library is ready for later
document.addEventListener('DOMContentLoaded', ()=>{
    AOS.init({ duration: 800 });
    initLightbox();
    initFinalScreen();
});

// Initialize final screen interactions (love button + fireworks)
function initFinalScreen() {
    const loveBtn = document.getElementById('loveBtn');
    if (!loveBtn) return;

    loveBtn.addEventListener('click', () => {
        if (loveBtn.disabled) return;
        loveBtn.disabled = true;

        try { playClickTone(); } catch (e) {}

        const DURATION = 8000; // Bắn trong 8 giây
        const animationEnd = Date.now() + DURATION;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                loveBtn.disabled = false;
                return;
            }

            const particleCount = 40;
            
            // Bắn ngẫu nhiên khắp màn hình
            confetti({
                particleCount,
                startVelocity: 30,
                spread: 360,
                origin: { 
                    x: Math.random(), 
                    y: Math.random() - 0.2 // Bắn hơi cao lên một chút
                },
                colors: ['#ff4d6d', '#ff8fa3', '#ff758f', '#ffb3c1', '#ffffff'],
                shapes: ['heart'],
                scalar: 1.2 // Pháo to hơn chút cho đẹp
            });
        }, 250);

        // Hiệu ứng zoom thẻ card khi nhấn
        const card = document.querySelector('.end-card');
        if (card) {
            card.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => card.classList.remove('animate__pulse'), 1000);
        }
    });
}

function playClickTone(){
    try{
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 440;
        g.gain.value = 0.001;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        o.stop(ctx.currentTime + 0.22);
    } catch(e){/*ignore*/}
}

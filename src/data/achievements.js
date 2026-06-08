import { eventBus } from '../core/event-bus.js';
import { playAchievement } from '../core/audio-manager.js';

export const ACHIEVEMENTS = [
    {id:'first_blood', name:'Первый контакт', desc:'Собери первую деталь', icon:'🔧', unlocked:false},
    {id:'speedster', name:'Скоростной сбор', desc:'Собери деталь за 75% времени', icon:'⚡', unlocked:false},
    {id:'perfect', name:'Шедевр', desc:'Собери ВСЕ детали на 3 звезды', icon:'⭐', unlocked:false},
    {id:'streak3', name:'На волне', desc:'3 идеальных уровня подряд', icon:'🔥', unlocked:false},
    {id:'star_collector', name:'Звёздный охотник', desc:'Набери 30 звёзд за уровни', icon:'💫', unlocked:false},
    {id:'colorist', name:'Колорист', desc:'Измени цвет детали в пресцене', icon:'🎨', unlocked:false},
    {id:'assembler', name:'Инженер', desc:'Собери весь дрон', icon:'🚁', unlocked:false},
];

export let levelStars = [];
export let colorChanged = false;
export let userChangedColor = false;

export function checkAchievements(trigger, data = {}) {
    const unlock = (id) => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        if (a && !a.unlocked) {
            a.unlocked = true;
            playAchievement();
            showAchievementToast(a);
            eventBus.emit('achievementUnlocked', a);
        }
    };

    if (trigger === 'snap') {
        unlock('first_blood');
        levelStars[data.level] = data.stars;
        if (levelStars.length === data.totalParts && levelStars.every(s => s === 3)) unlock('perfect');
        if (data.timeLeft / data.timeLimit >= 0.75) unlock('speedster');
        if (data.streakCount >= 3) unlock('streak3');

        // Проверяем 30 звёзд
        const totalStars = levelStars.reduce((sum, s) => sum + (s || 0), 0);
        if (totalStars >= 30) unlock('star_collector');
    }
    if (trigger === 'color') unlock('colorist');
    if (trigger === 'complete') unlock('assembler');
}

function showAchievementToast(ach) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:70px;right:20px;background:rgba(255,255,255,0.98);border:1px solid #ddd6fe;border-radius:12px;padding:12px 16px;z-index:200;box-shadow:0 4px 20px rgba(99,54,160,0.2);display:flex;align-items:center;gap:10px;animation:slideInRight 0.4s ease;font-family:Arial,sans-serif;';
    toast.innerHTML = '<span style="font-size:24px">' + ach.icon + '</span><div><div style="font-size:11px;color:#6336a0;font-weight:600">ДОСТИЖЕНИЕ!</div><div style="font-size:13px;color:#1f2937;font-weight:bold">' + ach.name + '</div><div style="font-size:11px;color:#6b7280">' + ach.desc + '</div></div>';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
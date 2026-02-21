/**
 * Narrative Scoring Engine
 * 
 * 5 scenarios with 4 options each. Every option maps to narrative profile attributes
 * with weighted scores. After the test, calculateProfile() aggregates everything
 * into a complete ADN Narrativo profile.
 */

export const SCENARIOS = [
    // ── Scenario 1: Role + Initiative ──
    {
        id: 'room',
        text: 'Entrás a una habitación desconocida. La puerta se cierra detrás de vos. ¿Qué hacés?',
        emoji: '🚪',
        options: [
            {
                id: 'explore',
                text: 'Explorás cada rincón buscando pistas',
                emoji: '🔍',
                scores: { roleType: 'explorador', narrativeInitiative: 4, improvisationLevel: 3 },
            },
            {
                id: 'wait',
                text: 'Esperás en silencio para entender qué pasa',
                emoji: '🤫',
                scores: { roleType: 'sumiso', narrativeInitiative: 2, improvisationLevel: 2 },
            },
            {
                id: 'command',
                text: 'Gritás "¡Hay alguien ahí!" con autoridad',
                emoji: '📢',
                scores: { roleType: 'dominante', narrativeInitiative: 5, improvisationLevel: 3 },
            },
            {
                id: 'create',
                text: 'Inventás una historia sobre por qué estás ahí',
                emoji: '✨',
                scores: { roleType: 'explorador', narrativeInitiative: 4, improvisationLevel: 5 },
            },
        ],
    },

    // ── Scenario 2: Improvisation + Pace ──
    {
        id: 'twist',
        text: 'Tu compañero de historia escribe algo completamente inesperado que cambia todo. ¿Cómo reaccionás?',
        emoji: '🌀',
        options: [
            {
                id: 'embrace',
                text: 'Te encanta el caos y seguís la corriente',
                emoji: '🎲',
                scores: { improvisationLevel: 5, emotionalPace: 'intenso' },
            },
            {
                id: 'adapt',
                text: 'Lo integrás suavemente a tu propia trama',
                emoji: '🧩',
                scores: { improvisationLevel: 4, emotionalPace: 'progresivo' },
            },
            {
                id: 'redirect',
                text: 'Buscás volver a la dirección original',
                emoji: '🧭',
                scores: { improvisationLevel: 2, emotionalPace: 'lento' },
            },
            {
                id: 'pause',
                text: 'Pedís una pausa para procesar antes de responder',
                emoji: '⏸️',
                scores: { improvisationLevel: 1, emotionalPace: 'lento' },
            },
        ],
    },

    // ── Scenario 3: Writing Style ──
    {
        id: 'sunset',
        text: 'Tenés que describir una puesta de sol en tu historia. ¿Cómo lo hacés?',
        emoji: '🌅',
        options: [
            {
                id: 'poetic',
                text: '"El cielo sangra colores que ningún pintor podría robar..."',
                emoji: '🎨',
                scores: { writingStyle: 'poetico' },
            },
            {
                id: 'direct',
                text: '"El sol cae. Se oscurece. Hay que moverse."',
                emoji: '⚡',
                scores: { writingStyle: 'directo' },
            },
            {
                id: 'descriptive',
                text: '"El horizonte se tiñe de naranja y violeta, mientras el viento trae olor a jazmín..."',
                emoji: '📝',
                scores: { writingStyle: 'descriptivo' },
            },
            {
                id: 'minimal',
                text: '"Atardecer."',
                emoji: '💎',
                scores: { writingStyle: 'minimalista' },
            },
        ],
    },

    // ── Scenario 4: Intensity + Plots ──
    {
        id: 'tension',
        text: 'La tensión entre dos personajes crece con cada línea. ¿Hacia dónde llevás la escena?',
        emoji: '🔥',
        options: [
            {
                id: 'slow',
                text: 'Dejás que la tensión crezca lentamente, sin resolver nada',
                emoji: '🕯️',
                scores: { preferredIntensity: 2, plots: ['slow-burn', 'drama-psicológico'] },
            },
            {
                id: 'explode',
                text: 'Explotás la escena al máximo: gritos, pasión, caos',
                emoji: '💥',
                scores: { preferredIntensity: 5, plots: ['acción', 'pasión'] },
            },
            {
                id: 'twist_it',
                text: 'Metés un giro inesperado que cambia toda la dinámica',
                emoji: '🔄',
                scores: { preferredIntensity: 3, plots: ['misterio', 'thriller'] },
            },
            {
                id: 'emotional',
                text: 'Profundizás en los sentimientos internos de los personajes',
                emoji: '💔',
                scores: { preferredIntensity: 3, plots: ['romance', 'drama-psicológico'] },
            },
        ],
    },

    // ── Scenario 5: Genres ──
    {
        id: 'world',
        text: 'Si pudieras vivir dentro de una historia, ¿qué mundo elegirías?',
        emoji: '🌍',
        options: [
            {
                id: 'dark',
                text: 'Un castillo gótico lleno de secretos oscuros',
                emoji: '🏰',
                scores: { genres: ['dark', 'gótico', 'misterio'] },
            },
            {
                id: 'fantasy',
                text: 'Un reino mágico donde todo es posible',
                emoji: '🧙',
                scores: { genres: ['fantasía', 'adventure'] },
            },
            {
                id: 'urban',
                text: 'Una ciudad moderna llena de tensión y deseo',
                emoji: '🌃',
                scores: { genres: ['urbano', 'contemporáneo', 'romance'] },
            },
            {
                id: 'scifi',
                text: 'Una estación espacial donde la humanidad se reinventa',
                emoji: '🚀',
                scores: { genres: ['sci-fi', 'futurista'] },
            },
        ],
    },
];

/**
 * Calculate a complete narrative profile from 5 scenario answers.
 * 
 * @param {Array<{scenarioId: string, optionId: string}>} answers
 * @returns {Object} Narrative profile fields ready for Appwrite
 */
export function calculateProfile(answers) {
    const profile = {
        writingStyle: 'descriptivo',
        emotionalPace: 'progresivo',
        roleType: 'explorador',
        improvisationLevel: 3,
        narrativeInitiative: 3,
        preferredIntensity: 3,
        plotPreferences: [],
        preferredGenres: [],
    };

    const numericAccum = {
        improvisationLevel: [],
        narrativeInitiative: [],
        preferredIntensity: [],
    };

    for (const answer of answers) {
        const scenario = SCENARIOS.find(s => s.id === answer.scenarioId);
        if (!scenario) continue;

        const option = scenario.options.find(o => o.id === answer.optionId);
        if (!option) continue;

        const s = option.scores;

        // String attributes — last write wins (each scenario targets one)
        if (s.writingStyle) profile.writingStyle = s.writingStyle;
        if (s.emotionalPace) profile.emotionalPace = s.emotionalPace;
        if (s.roleType) profile.roleType = s.roleType;

        // Numeric attributes — collect for averaging
        if (s.improvisationLevel !== undefined) numericAccum.improvisationLevel.push(s.improvisationLevel);
        if (s.narrativeInitiative !== undefined) numericAccum.narrativeInitiative.push(s.narrativeInitiative);
        if (s.preferredIntensity !== undefined) numericAccum.preferredIntensity.push(s.preferredIntensity);

        // Array attributes — merge unique
        if (s.plots) {
            for (const p of s.plots) {
                if (!profile.plotPreferences.includes(p)) profile.plotPreferences.push(p);
            }
        }
        if (s.genres) {
            for (const g of s.genres) {
                if (!profile.preferredGenres.includes(g)) profile.preferredGenres.push(g);
            }
        }
    }

    // Average numeric values
    for (const key of Object.keys(numericAccum)) {
        const vals = numericAccum[key];
        if (vals.length > 0) {
            profile[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
    }

    return profile;
}

'use client';

import { motion } from 'framer-motion';

export function LoginAnimation() {
  return (
    <div className="relative hidden w-full overflow-hidden bg-brand-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Background gradients */}
      <div className="absolute -left-1/4 -top-1/4 size-[800px] rounded-full bg-brand-gold/20 blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 size-[600px] rounded-full bg-brand-red/20 blur-[100px]" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl font-black tracking-tight text-white xl:text-5xl">
            Gérez vos <br />
            <span className="text-brand-gold">événements</span> avec <br />
            <span className="text-brand-red">précision</span>.
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/70">
            Work Class Gabon centralise la billetterie, le contrôle d&apos;accès et
            l&apos;émission de certificats en temps réel.
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        {/* Floating animated elements representing tickets / certificates */}
        <div className="relative size-64 xl:size-80">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-0 top-0 h-48 w-36 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md"
          >
            <div className="h-4 w-1/2 rounded-full bg-brand-gold/50" />
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full rounded-full bg-white/20" />
              <div className="h-2 w-4/5 rounded-full bg-white/20" />
            </div>
            <div className="mt-auto pt-16">
              <div className="h-8 w-8 rounded bg-brand-red/50" />
            </div>
          </motion.div>

          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute bottom-0 right-0 h-40 w-48 rounded-2xl border border-white/10 bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-navy/50" />
              <div className="space-y-2 flex-1">
                <div className="h-2 w-full rounded-full bg-white/40" />
                <div className="h-2 w-2/3 rounded-full bg-white/40" />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <div className="h-6 w-16 rounded-lg bg-brand-navy/30" />
              <div className="h-6 w-6 rounded-full bg-white/20" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-sm text-white/50">
        <span>© {new Date().getFullYear()} Work Class Gabon.</span>
        <span>Système d&apos;Administration Sécurisé</span>
      </div>
    </div>
  );
}

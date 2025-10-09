/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// LiveKit Voice Agent Colors
  			fg0: 'var(--fg0)',
  			fg1: 'var(--fg1)',
  			fg2: 'var(--fg2)',
  			fg3: 'var(--fg3)',
  			fg4: 'var(--fg4)',
  			fgSerious: 'var(--fgSerious)',
  			fgSuccess: 'var(--fgSuccess)',
  			fgModerate: 'var(--fgModerate)',
  			fgAccent: 'var(--fgAccent)',
  			bg1: 'var(--bg1)',
  			bg2: 'var(--bg2)',
  			bg3: 'var(--bg3)',
  			bgSerious: 'var(--bgSerious)',
  			bgSerious2: 'var(--bgSerious2)',
  			bgSuccess: 'var(--bgSuccess)',
  			bgModerate: 'var(--bgModerate)',
  			bgAccent: 'var(--bgAccent)',
  			bgAccentPrimary: 'var(--bgAccentPrimary)',
  			separator1: 'var(--separator1)',
  			separator2: 'var(--separator2)',
  			separatorSerious: 'var(--separatorSerious)',
  			separatorSuccess: 'var(--separatorSuccess)',
  			// Original shadcn colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

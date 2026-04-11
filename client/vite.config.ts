import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, '../shared/src')
		}
	},
	server: {
		port: 27451,
		proxy: {
			'/api': 'http://localhost:27452'
		}
	}
})

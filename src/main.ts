import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { authInterceptor } from './app/core/services/session.service';

bootstrapApplication(App, {
    providers: [provideHttpClient(withInterceptors([authInterceptor]))]
}).catch(error => console.error(error));

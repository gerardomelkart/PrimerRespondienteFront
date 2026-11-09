import { Component, inject } from '@angular/core';
import { SessionService } from './core/services/session.service';
import { LoginPage } from './pages/login/login';
import { MainLayout } from './layout/main-layout';

@Component({
    selector: 'app-root',
    imports: [LoginPage, MainLayout],
    templateUrl: './app.html'
})
export class App
{
    readonly session = inject(SessionService);
}

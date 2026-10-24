import { Component, input } from '@angular/core';

@Component({
    selector: 'app-informes',
    templateUrl: './informes.html',
    styleUrl: './informes.css'
})
export class InformesPage
{
    readonly completo = input(false);
}

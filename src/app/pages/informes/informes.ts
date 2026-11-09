import { Component, input } from '@angular/core';

@Component({
    selector: 'app-informes',
    templateUrl: './informes.html'
})
export class InformesPage
{
    readonly completo = input(false);
}

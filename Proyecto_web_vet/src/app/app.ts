import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  // Si mantuviste <h1>Hello, {{ title() }}</h1> en app.html,
  // deja este método; si lo quitaste, puedes borrar el método.
  title() { return 'Ecommerce XML'; }
}

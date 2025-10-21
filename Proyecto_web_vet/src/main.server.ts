import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config as appServerConfig } from './app/app.config.server';

// 👇 tipar el context como any (o unknown) para evitar error TS
export default function bootstrap(context: any) {
  return bootstrapApplication(AppComponent, appServerConfig, context);
}

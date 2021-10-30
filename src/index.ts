// Entrypoint for the application, this should not need to be edited
import { Application } from "./application";

const application = new Application();
application.start()
  .catch((err) => console.error("Application crashed", err));

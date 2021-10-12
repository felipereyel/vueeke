export default class Debugger {
  static state = false;

  static toggle() {
    Debugger.state = !Debugger.state;
    return Debugger.state;
  }

  static print(anything: any) {
    if (Debugger.state) {
      console.log(anything);
    }
  }
}

(window as any).debug = Debugger;

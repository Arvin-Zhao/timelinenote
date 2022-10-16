export class TimeLineNote{
    private filename:string;
    constructor(filename:string){
        this.filename = filename;
    }

    process(){
        console.log("process");
        return {};
    }
}
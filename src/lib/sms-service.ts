import {prisma} from "./prisma"

export const generateOTP=():string=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
}


export const verifyOTP=async(phone:string,otp:string):Promise<boolean>=>{
    const storedOTP=await prisma.oTP.findFirst({
        where:{
            phone,otp,expiresAt:{
                gte:new Date(),
            }
        }
    });

    if(storedOTP){
        await prisma.oTP.delete({where:{id:storedOTP.id}});
        return true;
    }

    return false;
}
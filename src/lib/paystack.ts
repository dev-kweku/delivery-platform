import Paystack from "paystack"

const paystack=Paystack(process.env.PAYSTACK_SECRET_KEY!)

export const initializePayment=async(email:string,amount:number,metadata:unknown,reference:string,name:string)=>{
    return await paystack.transaction.initialize({
        email,
        amount: amount * 100,
        metadata,
        reference: reference,
        name: name,
        callback_url:`${process.env.NEXTAUTH_URL}/api/payments/paystack/webhook`,
    })
};

export const verifyPayment=async(reference:string)=>{
    return await paystack.transaction.verify(reference);
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Bill } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const notificationSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface BillNotificationSignupProps {
  bill: Bill;
}

const BillNotificationSignup = ({ bill }: BillNotificationSignupProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: NotificationFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Here you would typically send this to a backend service
      // For now, we'll just simulate a successful signup
      console.log("Notification signup for bill:", bill.id, "with email:", data.email);
      
      // Show success toast
      toast("Notification Signup Successful", {
        description: `You'll be notified of updates to ${bill.title}`
      });
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error signing up for notifications:", error);
      toast("Signup Failed", {
        description: "There was a problem signing up for notifications. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mt-6">
      <h3 className="text-xl font-semibold mb-4">Get Notified of Updates</h3>
      <p className="text-gray-600 mb-4">
        Enter your email to receive notifications when this bill is updated.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your@email.com" 
                    {...field} 
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing up..." : "Sign up for notifications"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BillNotificationSignup;

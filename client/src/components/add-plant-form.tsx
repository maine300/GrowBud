import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertPlantSchema } from "@shared/schema";
import type { InsertPlant } from "@shared/schema";

export default function AddPlantForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      name: "",
      strainType: "",
      location: "",
      stage: "",
      plantedDate: new Date(),
    },
  });

  const addPlantMutation = useMutation({
    mutationFn: async (data: InsertPlant) => {
      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add plant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      form.reset();
      toast({
        title: "Plant added",
        description: "Your new plant has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlant) => {
    addPlantMutation.mutate(data);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">Add New Plant</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Plant Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter plant name"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-plant-green-500 focus:border-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strainType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Strain Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-plant-green-500 focus:border-transparent">
                        <SelectValue placeholder="Select strain type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="indica">Indica</SelectItem>
                      <SelectItem value="sativa">Sativa</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-plant-green-500 focus:border-transparent">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="indoor">Indoor</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="greenhouse">Greenhouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Growth Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-plant-green-500 focus:border-transparent">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="seedling">Seedling</SelectItem>
                      <SelectItem value="vegetative">Vegetative</SelectItem>
                      <SelectItem value="flowering">Flowering</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-plant-green-600 hover:bg-plant-green-700 text-white font-medium"
              disabled={addPlantMutation.isPending}
            >
              {addPlantMutation.isPending ? "Adding..." : "Add Plant"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

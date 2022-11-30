ALTER TABLE public."comments" ADD CONSTRAINT recipe_comment_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public."comments" ADD CONSTRAINT user_comment_fk FOREIGN KEY (user_fk) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.label_recipe_map ADD CONSTRAINT label_labelrecipemap_fk FOREIGN KEY (label_fk) REFERENCES public."label"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.label_recipe_map ADD CONSTRAINT recipe_labelrecipemap_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.likes ADD CONSTRAINT recipe_like_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.likes ADD CONSTRAINT user_like_fk FOREIGN KEY (user_fk) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.pics ADD CONSTRAINT recipe_pic_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.pics ADD CONSTRAINT user_pics_fk FOREIGN KEY (user_fk) REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.quantity ADD CONSTRAINT ingredient_quantity_fk FOREIGN KEY (ingredient_fk) REFERENCES public.ingredient(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public.quantity ADD CONSTRAINT recipe_quantity_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.quantity ADD CONSTRAINT unit_quantity_fk FOREIGN KEY (unit_fk) REFERENCES public.unit(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.recipe ADD CONSTRAINT recipe_user_created_fk FOREIGN KEY (created_by_user_fk) REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.steps ADD CONSTRAINT recipe_step_fk FOREIGN KEY (recipe_fk) REFERENCES public.recipe(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.users ADD CONSTRAINT pic_users_fk FOREIGN KEY (pic_fk) REFERENCES public.pics(id) ON DELETE SET NULL ON UPDATE CASCADE;
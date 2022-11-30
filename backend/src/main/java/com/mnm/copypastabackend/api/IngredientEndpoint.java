package com.mnm.copypastabackend.api;

import com.mnm.copypastabackend.entities.Ingredient;
import com.mnm.copypastabackend.repositories.IngredientRepository;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(path = "/ingredients")
@Api(value = "Endpoint for interacting with ingredients")
public class IngredientEndpoint {

    @Autowired
    private IngredientRepository ingredientRepository;

    @GetMapping("/")
    public ResponseEntity<List<Ingredient>> getAllIngredients() {
        return ResponseEntity.ok(ingredientRepository.findAllByOrderByName());
    }

    @GetMapping("/names")
    public ResponseEntity<List<String>> getAllIngredientNames() {
        return ResponseEntity.ok(ingredientRepository.getIngredientNames());
    }

    @PutMapping("/")
    public ResponseEntity<Integer> updateIngredients(@RequestBody List<Ingredient> ingredients) {
        int updatedAmount = 0;
        for (Ingredient changedIngredient : ingredients) {
            Optional<Ingredient> ingredientOptional = ingredientRepository.findById(changedIngredient.getId());
            if (ingredientOptional.isPresent()) {
                Ingredient ingredientFromDb = ingredientOptional.get();
                // frontend only sets values of dirty input fields to help avoid collisions (multiple users change at the same time)
                if (changedIngredient.getName() != null) {
                    ingredientFromDb.setName(changedIngredient.getName());
                }
                if (changedIngredient.getSource() != null) {
                    ingredientFromDb.setSource(changedIngredient.getSource());
                }
                ingredientRepository.save(ingredientFromDb);
                updatedAmount++;
            }
        }
        return ResponseEntity.ok(updatedAmount);
    }
}
